// Converte video para MP4 web com bitrate controlado (H.264 + AAC, faststart)
// e extrai um poster. Usa AVAssetReader/Writer para poder definir o bitrate,
// coisa que os presets do AVAssetExportSession nao permitem.
// Uso: video-web <entrada> <saida.mp4> <poster.jpg> <ladoMaior> <kbpsVideo>
import Foundation
import AVFoundation
import AppKit

let a = CommandLine.arguments
guard a.count >= 6 else { print("uso: video-web <in> <out.mp4> <poster.jpg> <ladoMaior> <kbps>"); exit(1) }
let inURL = URL(fileURLWithPath: a[1]), outURL = URL(fileURLWithPath: a[2]), posterURL = URL(fileURLWithPath: a[3])
let ladoMaior = CGFloat(Int(a[4]) ?? 1280)
let kbps = Int(a[5]) ?? 1600

let asset = AVURLAsset(url: inURL)
let sem = DispatchSemaphore(value: 0)

Task {
  do {
    let dur = try await asset.load(.duration)
    let segundos = CMTimeGetSeconds(dur)
    guard let vTrack = try await asset.loadTracks(withMediaType: .video).first else { print("sem video"); exit(2) }
    let nat = try await vTrack.load(.naturalSize)
    let transform = try await vTrack.load(.preferredTransform)

    // dimensoes ja considerando a rotacao do celular
    let vis = nat.applying(transform)
    let vw = abs(vis.width), vh = abs(vis.height)
    var escala = min(1.0, ladoMaior / max(vw, vh))
    // H.264 quer dimensoes pares
    func par(_ v: CGFloat) -> Int { let n = Int((v * escala).rounded()); return n % 2 == 0 ? n : n + 1 }
    let ow = par(nat.width), oh = par(nat.height)
    print(String(format: "  origem %.0fx%.0f  %.1fs  ->  saida %dx%d @ %dkbps", vw, vh, segundos, ow, oh, kbps))

    try? FileManager.default.removeItem(at: outURL)
    let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true

    let vSettings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: ow, AVVideoHeightKey: oh,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: kbps * 1000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoAllowFrameReorderingKey: true,
        AVVideoMaxKeyFrameIntervalKey: 60
      ]
    ]
    let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: vSettings)
    vIn.expectsMediaDataInRealTime = false
    vIn.transform = transform          // preserva a rotacao sem re-renderizar
    writer.add(vIn)

    let reader = try AVAssetReader(asset: asset)
    let vOut = AVAssetReaderTrackOutput(track: vTrack,
      outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    reader.add(vOut)

    // audio (alguns clipes podem nao ter)
    var aIn: AVAssetWriterInput? = nil
    var aOut: AVAssetReaderTrackOutput? = nil
    if let aTrack = try await asset.loadTracks(withMediaType: .audio).first {
      let s = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2,
        AVSampleRateKey: 44100, AVEncoderBitRateKey: 96000])
      s.expectsMediaDataInRealTime = false
      writer.add(s); aIn = s
      let o = AVAssetReaderTrackOutput(track: aTrack,
        outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
      reader.add(o); aOut = o
    }

    reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
    let q = DispatchQueue(label: "conv")
    let grupo = DispatchGroup()

    grupo.enter()
    vIn.requestMediaDataWhenReady(on: q) {
      while vIn.isReadyForMoreMediaData {
        if let sb = vOut.copyNextSampleBuffer() { vIn.append(sb) }
        else { vIn.markAsFinished(); grupo.leave(); return }
      }
    }
    if let aIn, let aOut {
      grupo.enter()
      aIn.requestMediaDataWhenReady(on: q) {
        while aIn.isReadyForMoreMediaData {
          if let sb = aOut.copyNextSampleBuffer() { aIn.append(sb) }
          else { aIn.markAsFinished(); grupo.leave(); return }
        }
      }
    }
    grupo.wait()
    await writer.finishWriting()
    if writer.status != .completed { print("falhou: \(writer.error?.localizedDescription ?? "?")"); exit(4) }

    let gen = AVAssetImageGenerator(asset: asset)
    gen.appliesPreferredTrackTransform = true
    gen.maximumSize = CGSize(width: 1400, height: 1400)
    let (cg, _) = try await gen.image(at: CMTime(seconds: min(1.0, segundos/2), preferredTimescale: 600))
    if let jpg = NSBitmapImageRep(cgImage: cg).representation(using: .jpeg, properties: [.compressionFactor: 0.82]) {
      try jpg.write(to: posterURL)
    }
    print("  ok")
    sem.signal()
  } catch { print("erro: \(error)"); exit(5) }
}
sem.wait()
