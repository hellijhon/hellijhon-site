// Remove fundo xadrez "de transparência" que veio pintado como pixels reais.
// Faz flood fill a partir das bordas: só apaga fundo conectado à moldura,
// então elementos claros DENTRO do objeto (off-white) ficam intactos.
// Depois erode 1px para matar a franja anti-aliased.
// Uso: dexadrez <entrada.png> <saida.png>
import Foundation
import CoreGraphics
import ImageIO
import AppKit

let a = CommandLine.arguments
guard a.count >= 3 else { print("uso: dexadrez <in> <out>"); exit(1) }

guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("entrada invalida"); exit(1) }

let w = img.width, h = img.height
var px = [UInt8](repeating: 0, count: w * h * 4)
guard let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8,
                          bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))

// as duas cores do xadrez, amostradas nos cantos
func rgb(_ i: Int) -> (Int, Int, Int) { (Int(px[i*4]), Int(px[i*4+1]), Int(px[i*4+2])) }
var amostras: [(Int, Int, Int)] = []
for (x, y) in [(0,0),(1,0),(0,1),(w-1,0),(0,h-1),(w-1,h-1),(4,4),(12,4),(4,12)] {
    amostras.append(rgb(y*w + x))
}
var cores: [(Int, Int, Int)] = []
for c in amostras where !cores.contains(where: { abs($0.0-c.0) < 12 && abs($0.1-c.1) < 12 && abs($0.2-c.2) < 12 }) {
    cores.append(c)
}
print("cores de fundo detectadas: \(cores)")

let tol = 26
func ehFundo(_ i: Int) -> Bool {
    let c = rgb(i)
    for k in cores where abs(c.0-k.0) <= tol && abs(c.1-k.1) <= tol && abs(c.2-k.2) <= tol { return true }
    return false
}

// flood fill a partir de toda a borda
var fundo = [Bool](repeating: false, count: w * h)
var pilha = [Int]()
for x in 0..<w { pilha.append(x); pilha.append((h-1)*w + x) }
for y in 0..<h { pilha.append(y*w); pilha.append(y*w + w-1) }

while let i = pilha.popLast() {
    if fundo[i] || !ehFundo(i) { continue }
    fundo[i] = true
    let x = i % w, y = i / w
    if x > 0   { pilha.append(i-1) }
    if x < w-1 { pilha.append(i+1) }
    if y > 0   { pilha.append(i-w) }
    if y < h-1 { pilha.append(i+w) }
}

// erode 1px: pixel opaco encostado em fundo tambem vira fundo (tira a franja)
var final = fundo
for y in 1..<(h-1) {
    for x in 1..<(w-1) {
        let i = y*w + x
        if fundo[i] { continue }
        if fundo[i-1] || fundo[i+1] || fundo[i-w] || fundo[i+w] { final[i] = true }
    }
}

var apagados = 0
for i in 0..<(w*h) where final[i] {
    px[i*4] = 0; px[i*4+1] = 0; px[i*4+2] = 0; px[i*4+3] = 0
    apagados += 1
}
print("pixels apagados: \(apagados) de \(w*h) (\(apagados*100/(w*h))%)")

guard let out = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL,
                                                 "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("ok")
