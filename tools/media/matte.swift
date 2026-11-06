// Gera a máscara (matte) do primeiro plano usando o Vision nativo do macOS 14+.
// Uso: matte <entrada> <saida.png>
import Vision; import CoreImage; import AppKit
let a=CommandLine.arguments
let ci=CIImage(contentsOf:URL(fileURLWithPath:a[1]))!
let h=VNImageRequestHandler(ciImage:ci)
let r=VNGenerateForegroundInstanceMaskRequest()
try h.perform([r])
let o=r.results!.first!
let m=try o.generateScaledMaskForImage(forInstances:o.allInstances,from:h)
let c=CIContext()
let mi=CIImage(cvPixelBuffer:m)
try c.writePNGRepresentation(of:mi,to:URL(fileURLWithPath:a[2]),format:.L8,colorSpace:CGColorSpace(name:CGColorSpace.linearGray)!)
print("ok",mi.extent)
