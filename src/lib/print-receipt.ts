export const printThermalReceipt = (item: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const unitPrice = item.terjual > 0 ? (item.totalPayment / item.terjual) : 0;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk Pembelian - Freshtoria</title>
            <style>
                @page { margin: 0; }
                body {
                    margin: 0;
                    padding: 10px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 58mm; /* Ukuran thermal printer standar */
                    color: black;
                    background: white;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-bottom: 1px dashed black; margin: 8px 0; }
                .row { display: flex; justify-content: space-between; }
                .mb-2 { margin-bottom: 8px; }
                .title { font-size: 16px; margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="center bold title">FRESHTORIA</div>
            <div class="center mb-2">Struk Penjualan Jus</div>
            
            <div class="divider"></div>
            
            <div><span class="bold">Tgl   :</span> ${item.tanggalMasuk}</div>
            <div><span class="bold">Mitra :</span> ${item.mitra || "Umum"}</div>
            <div><span class="bold">Menu  :</span> ${item.menuSmoothies}</div>
            
            <div class="divider"></div>
            
            <div class="row">
                <span>Harga Satuan:</span>
                <span>Rp ${unitPrice.toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
                <span>Qty Terjual:</span>
                <span>${item.terjual} Botol</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row bold">
                <span>TOTAL:</span>
                <span>Rp ${item.totalPayment.toLocaleString('id-ID')}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="center mb-2">Terima Kasih</div>
            
            <script>
                window.onload = () => {
                    window.print();
                    // Optional: Close window automatically after printing completes or is cancelled
                    // This varies heavily by browser, so a slight timeout handles most cases
                    setTimeout(() => window.close(), 1000);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
