// Divide um PNG com transparência em (1) JPEG do RGB sobre preto e
// (2) PNG preto carregando o recorte no canal alpha — usados juntos via
// mask-image no CSS. Pesa bem menos que o PNG transparente equivalente.
// Uso: split-alpha <entrada.png> <pasta-saida> <nome-base>
import Foundation
import CoreImage
import AppKit

let a = CommandLine.arguments
guard a.count >= 4 else { print("uso: split-alpha <in.png> <outdir> <base>"); exit(1) }
guard let ci = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { print("entrada invalida"); exit(1) }
let dir = URL(fileURLWithPath: a[2]), base = a[3]
let ctx = CIContext(), ext = ci.extent

let flat = ci.composited(over: CIImage(color: .black).cropped(to: ext))
try ctx.writeJPEGRepresentation(of: flat, to: dir.appendingPathComponent("\(base).jpg"),
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.86])

let mask = ci.applyingFilter("CIColorMatrix", parameters: [
    "inputRVector": CIVector(x:0,y:0,z:0,w:0), "inputGVector": CIVector(x:0,y:0,z:0,w:0),
    "inputBVector": CIVector(x:0,y:0,z:0,w:0), "inputAVector": CIVector(x:0,y:0,z:0,w:1)])
try ctx.writePNGRepresentation(of: mask, to: dir.appendingPathComponent("\(base)-mask.png"),
    format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("ok \(Int(ext.width))x\(Int(ext.height))")
