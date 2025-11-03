import { ArrowLeft, Shield, FileText, AlertCircle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  const [, navigate] = useLocation();

  const sections = [
    {
      icon: FileText,
      title: "1. Syarat Penggunaan",
      content: [
        "Dengan menggunakan layanan Idachi Fitness, Anda setuju untuk mematuhi syarat dan ketentuan yang berlaku.",
        "Anda harus berusia minimal 17 tahun atau memiliki izin dari orang tua/wali untuk menggunakan layanan kami.",
        "Akun yang dibuat harus menggunakan informasi yang valid dan akurat.",
        "Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda."
      ]
    },
    {
      icon: Shield,
      title: "2. Privasi & Keamanan Data",
      content: [
        "Kami berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda.",
        "Data yang kami kumpulkan meliputi: nama, email, nomor telepon, dan foto profil.",
        "Data Anda tidak akan dibagikan kepada pihak ketiga tanpa persetujuan Anda.",
        "Kami menggunakan enkripsi dan protokol keamanan standar industri untuk melindungi data Anda.",
        "Anda memiliki hak untuk mengakses, mengubah, atau menghapus data pribadi Anda kapan saja."
      ]
    },
    {
      icon: Scale,
      title: "3. Keanggotaan & Pembayaran",
      content: [
        "Membership Idachi Fitness tersedia dalam berbagai paket dengan durasi dan harga yang berbeda.",
        "Pembayaran dapat dilakukan melalui berbagai metode yang tersedia di aplikasi.",
        "Pembayaran bersifat final dan tidak dapat dikembalikan kecuali dalam kondisi tertentu sesuai kebijakan kami.",
        "Keanggotaan akan otomatis diperpanjang kecuali Anda membatalkannya sebelum tanggal perpanjangan.",
        "Kami berhak mengubah harga membership dengan pemberitahuan 30 hari sebelumnya."
      ]
    },
    {
      icon: AlertCircle,
      title: "4. Penggunaan Fasilitas Gym",
      content: [
        "Member wajib melakukan check-in sebelum menggunakan fasilitas gym.",
        "Fasilitas gym hanya dapat digunakan selama membership masih aktif.",
        "Member wajib mematuhi peraturan gym dan etika penggunaan alat fitness.",
        "Kami tidak bertanggung jawab atas cedera yang terjadi akibat kelalaian member.",
        "Member wajib menjaga kebersihan dan tidak merusak fasilitas gym.",
        "Penggunaan fasilitas gym sepenuhnya menjadi tanggung jawab member."
      ]
    },
    {
      icon: FileText,
      title: "5. Pembatalan & Pengembalian Dana",
      content: [
        "Pembatalan membership dapat dilakukan melalui aplikasi atau dengan menghubungi customer service.",
        "Pengembalian dana hanya berlaku untuk kondisi tertentu seperti force majeure atau kesalahan sistem.",
        "Proses pengembalian dana akan diproses dalam 14 hari kerja.",
        "Pembatalan class booking dapat dilakukan maksimal 2 jam sebelum jadwal dimulai.",
        "Late cancellation atau no-show dapat dikenakan denda sesuai kebijakan yang berlaku."
      ]
    },
    {
      icon: Shield,
      title: "6. Hak Kekayaan Intelektual",
      content: [
        "Seluruh konten di aplikasi Idachi Fitness termasuk logo, desain, dan materi lainnya adalah hak milik Idachi Fitness.",
        "Dilarang menyalin, memodifikasi, atau mendistribusikan konten tanpa izin tertulis dari kami.",
        "Foto atau video yang diambil di dalam gym hanya untuk keperluan pribadi.",
        "Penggunaan komersial dari foto/video di gym memerlukan izin tertulis."
      ]
    },
    {
      icon: AlertCircle,
      title: "7. Perubahan Syarat & Ketentuan",
      content: [
        "Idachi Fitness berhak mengubah syarat dan ketentuan ini sewaktu-waktu.",
        "Perubahan akan diberitahukan melalui email atau notifikasi di aplikasi.",
        "Penggunaan layanan setelah perubahan berarti Anda menyetujui syarat dan ketentuan yang baru.",
        "Anda dapat berhenti menggunakan layanan kami jika tidak setuju dengan perubahan yang dilakukan."
      ]
    },
    {
      icon: Scale,
      title: "8. Hukum yang Berlaku",
      content: [
        "Syarat dan ketentuan ini diatur oleh hukum yang berlaku di Republik Indonesia.",
        "Setiap perselisihan akan diselesaikan melalui musyawarah terlebih dahulu.",
        "Jika musyawarah tidak tercapai, perselisihan akan diselesaikan melalui pengadilan yang berwenang.",
        "Yurisdiksi eksklusif berada di Pengadilan Negeri tempat kedudukan Idachi Fitness."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground">Syarat dan Ketentuan Penggunaan</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-6">
          {/* Introduction */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-neon-purple/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Selamat Datang di Idachi Fitness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Terima kasih telah memilih Idachi Fitness sebagai partner fitness Anda. 
                Harap baca syarat dan ketentuan berikut dengan seksama sebelum menggunakan layanan kami.
              </p>
              <p className="font-medium text-foreground mt-4">
                Dengan menggunakan aplikasi dan layanan Idachi Fitness, Anda dianggap telah membaca, 
                memahami, dan menyetujui semua syarat dan ketentuan yang tercantum di bawah ini.
              </p>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <div key={pIndex}>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                      {pIndex < section.content.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Contact Info */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Hubungi Kami</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami:
              </p>
              <div className="space-y-1 mt-4">
                <p className="font-medium">Email: support@idachifitness.com</p>
                <p className="font-medium">Telepon: +62 812-3456-7890</p>
                <p className="font-medium">Alamat: Jl. Fitness No. 123, Jakarta</p>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <p className="text-center text-xs text-muted-foreground pb-4">
            Terakhir diperbarui: 3 November 2024
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
