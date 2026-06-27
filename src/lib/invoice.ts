import { Project } from '../types';

const TRANSFER_BANK = {
  bank: 'BRI',
  accountNumber: '016101057278503',
  accountName: 'Diyaz Najib'
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function rupiah(value: unknown) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function invoiceNumber(project: Project) {
  const date = new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('');
  return `INV-SIM-${ymd}-${String(project.id || 'PROJECT').slice(0, 6).toUpperCase()}`;
}

function getBillingRows(project: Project) {
  const paymentScheme = project.payment_scheme === 'per_user_contract' ? 'per_user_contract' : 'one_time';

  if (paymentScheme === 'per_user_contract') {
    const pricePerUser = Number(project.price_per_user || 0);
    const userCount = Number(project.user_count || 0);
    const monthlyAmount = Number(project.monthly_amount || 0) || pricePerUser * userCount || Number(project.total_price || 0);

    return {
      title: 'Tagihan Bulanan Kontrak Per User',
      badge: 'Per User / Bulan',
      totalDue: monthlyAmount,
      rows: [
        {
          description: `Biaya layanan ${escapeHtml(project.project_name)} per user per bulan`,
          qty: userCount > 0 ? `${userCount} user` : '1 paket',
          unit: pricePerUser > 0 ? rupiah(pricePerUser) : rupiah(monthlyAmount),
          amount: rupiah(monthlyAmount)
        }
      ],
      summaryRows: [
        ['Subtotal bulanan', rupiah(monthlyAmount)],
        ['Pembayaran tercatat di project', rupiah(project.dp_paid || 0)],
        ['Total tagihan bulan ini', rupiah(monthlyAmount)]
      ],
      note: 'Tagihan ini berlaku untuk periode bulanan berjalan sesuai jumlah user aktif pada project.'
    };
  }

  const contractValue = Number(project.deal_price || project.total_price || 0);
  const paid = Number(project.dp_paid || 0);
  const totalDue = Math.max(contractValue - paid, 0);

  return {
    title: 'Tagihan Project Sekali Bayar',
    badge: 'Sekali Bayar',
    totalDue,
    rows: [
      {
        description: `Pengerjaan project ${escapeHtml(project.project_name)}`,
        qty: '1 project',
        unit: rupiah(contractValue),
        amount: rupiah(contractValue)
      },
      {
        description: 'Pembayaran/DP yang sudah tercatat',
        qty: '-',
        unit: `-${rupiah(paid)}`,
        amount: `-${rupiah(paid)}`
      }
    ],
    summaryRows: [
      ['Nilai kontrak', rupiah(contractValue)],
      ['Pembayaran/DP tercatat', rupiah(paid)],
      ['Sisa tagihan', rupiah(totalDue)]
    ],
    note: totalDue > 0
      ? 'Sisa tagihan dibayarkan setelah invoice diterima atau sesuai kesepakatan termin project.'
      : 'Project ini sudah tercatat lunas pada dashboard.'
  };
}

export function printProjectInvoice(project: Project) {
  const billing = getBillingRows(project);
  const issuedDate = formatDate(new Date().toISOString());
  const invoiceNo = invoiceNumber(project);
  const dueDate = formatDate(project.deadline);
  const supportScope = project.support_scope || project.maintenance_terms || project.internal_notes || '';
  const printWindow = window.open('', '_blank', 'width=920,height=1200');

  if (!printWindow) {
    window.alert('Popup cetak diblokir browser. Izinkan popup untuk mencetak tagihan project.');
    return;
  }
  printWindow.opener = null;

  const itemRows = billing.rows.map((row) => `
    <tr>
      <td>
        <strong>${row.description}</strong>
        <span>${escapeHtml(project.website_category || 'Website Project')}</span>
      </td>
      <td>${row.qty}</td>
      <td>${row.unit}</td>
      <td>${row.amount}</td>
    </tr>
  `).join('');

  const summaryRows = billing.summaryRows.map(([label, value], index) => `
    <div class="${index === billing.summaryRows.length - 1 ? 'total-line' : ''}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');

  printWindow.document.write(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(invoiceNo)} - ${escapeHtml(project.client_name)}</title>
    <style>
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #eef1f5;
        color: #111827;
        font-family: Inter, Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: #fff;
        padding: 28px;
        position: relative;
      }
      .topbar {
        height: 10px;
        background: linear-gradient(90deg, #0f172a 0%, #ea580c 100%);
        margin: -28px -28px 28px;
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 28px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 26px;
      }
      .brand-mark {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #111827;
        color: #fff;
        font-weight: 900;
        letter-spacing: .04em;
      }
      .brand h1, .invoice-title h2 {
        margin: 0;
        letter-spacing: 0;
      }
      .brand {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .brand h1 {
        font-size: 22px;
        line-height: 1.1;
      }
      .brand p, .invoice-title p, .meta p, .note {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.55;
      }
      .invoice-title {
        text-align: right;
      }
      .invoice-title h2 {
        font-size: 32px;
        color: #ea580c;
      }
      .badge {
        display: inline-block;
        margin-top: 8px;
        border: 1px solid #fed7aa;
        background: #fff7ed;
        color: #c2410c;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .grid {
        display: grid;
        grid-template-columns: 1.1fr .9fr;
        gap: 18px;
        margin-top: 24px;
      }
      .panel {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 18px;
        background: #f8fafc;
      }
      .panel h3 {
        margin: 0 0 12px;
        font-size: 12px;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: .08em;
      }
      .client-name {
        font-size: 20px;
        font-weight: 900;
        color: #111827;
        margin-bottom: 8px;
      }
      .meta {
        display: grid;
        gap: 8px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 13px;
      }
      .meta-row span:first-child {
        color: #64748b;
      }
      .meta-row strong {
        text-align: right;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 26px;
        overflow: hidden;
        border-radius: 14px;
        border: 1px solid #e5e7eb;
      }
      th {
        background: #111827;
        color: #fff;
        padding: 14px;
        font-size: 11px;
        text-transform: uppercase;
        text-align: left;
        letter-spacing: .06em;
      }
      td {
        padding: 16px 14px;
        border-top: 1px solid #e5e7eb;
        vertical-align: top;
        font-size: 13px;
      }
      td span {
        display: block;
        color: #64748b;
        font-size: 11px;
        margin-top: 5px;
      }
      th:nth-child(2), th:nth-child(3), th:nth-child(4),
      td:nth-child(2), td:nth-child(3), td:nth-child(4) {
        text-align: right;
        white-space: nowrap;
      }
      .bottom {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 22px;
        margin-top: 24px;
        align-items: start;
      }
      .bank {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 16px;
        padding: 18px;
      }
      .bank h3, .terms h3 {
        margin: 0 0 12px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .bank-number {
        font-size: 24px;
        font-weight: 900;
        letter-spacing: .03em;
        color: #9a3412;
        margin: 8px 0;
      }
      .summary {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 18px;
      }
      .summary div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 8px 0;
        color: #475569;
        font-size: 13px;
      }
      .summary .total-line {
        margin-top: 10px;
        padding: 14px 0 0;
        border-top: 1px solid #e5e7eb;
        color: #111827;
        font-size: 18px;
      }
      .summary .total-line strong {
        color: #ea580c;
        font-size: 22px;
      }
      .terms {
        margin-top: 18px;
        padding: 18px;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
      }
      .terms p {
        margin: 0;
        color: #475569;
        font-size: 12px;
        line-height: 1.6;
      }
      footer {
        margin-top: 34px;
        padding-top: 18px;
        border-top: 1px solid #e5e7eb;
        color: #64748b;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      @media print {
        body { background: #fff; }
        .sheet { width: auto; min-height: auto; padding: 0; }
        .topbar { margin: 0 0 28px; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="topbar"></div>
      <header>
        <div class="brand">
          <div class="brand-mark">SW</div>
          <div>
            <h1>Simpluse Web Project</h1>
            <p>Jasa pembuatan website, dashboard bisnis, dan sistem informasi custom.</p>
            <p>Email: simpluse.web.project@gmail.com</p>
          </div>
        </div>
        <div class="invoice-title">
          <h2>INVOICE</h2>
          <p>${escapeHtml(invoiceNo)}</p>
          <span class="badge">${escapeHtml(billing.badge)}</span>
        </div>
      </header>

      <section class="grid">
        <div class="panel">
          <h3>Ditagihkan Kepada</h3>
          <div class="client-name">${escapeHtml(project.client_name || '-')}</div>
          <p>${escapeHtml(project.client_email || '-')}</p>
          <p>${escapeHtml(project.client_wa || '-')}</p>
        </div>
        <div class="panel meta">
          <h3>Detail Tagihan</h3>
          <div class="meta-row"><span>Jenis tagihan</span><strong>${escapeHtml(billing.title)}</strong></div>
          <div class="meta-row"><span>Tanggal terbit</span><strong>${escapeHtml(issuedDate)}</strong></div>
          <div class="meta-row"><span>Deadline project</span><strong>${escapeHtml(dueDate)}</strong></div>
          <div class="meta-row"><span>Status project</span><strong>${escapeHtml(project.status || '-')}</strong></div>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Jumlah</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <section class="bottom">
        <div>
          <div class="bank">
            <h3>Tujuan Transfer</h3>
            <p>Bank ${TRANSFER_BANK.bank}</p>
            <div class="bank-number">${TRANSFER_BANK.accountNumber}</div>
            <p>Atas nama <strong>${TRANSFER_BANK.accountName}</strong></p>
            <p class="note">Mohon kirim bukti transfer setelah pembayaran dilakukan agar status pembayaran segera diperbarui.</p>
          </div>
          <div class="terms">
            <h3>Catatan</h3>
            <p>${escapeHtml(billing.note)}</p>
            ${supportScope ? `<p style="margin-top:8px;">${escapeHtml(supportScope)}</p>` : ''}
          </div>
        </div>
        <aside class="summary">
          ${summaryRows}
          <div class="total-line">
            <span>Transfer</span>
            <strong>${escapeHtml(rupiah(billing.totalDue))}</strong>
          </div>
        </aside>
      </section>

      <footer>
        <span>Invoice dibuat otomatis dari dashboard Simpluse.</span>
        <span>Terima kasih atas kepercayaan Anda.</span>
      </footer>
    </main>
    <script>
      window.addEventListener('load', function () {
        window.focus();
        setTimeout(function () { window.print(); }, 250);
      });
    </script>
  </body>
</html>
  `);
  printWindow.document.close();
}
