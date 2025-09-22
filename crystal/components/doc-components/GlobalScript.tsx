import Script from 'next/script'

export const GlobalScript = () => {
  return (
    <Script id="clipboard-copy" strategy="afterInteractive">
      {`
        document.addEventListener('click', function (e) {
          const btn = e.target.closest('button[data-copy-target]');
          if (!btn) return;

          const id = btn.getAttribute('data-copy-target');
          const code = document.getElementById(id)?.textContent?.trim();

          if (code) {
            navigator.clipboard.writeText(code).then(() => {
              const original = btn.innerHTML;
              btn.innerHTML = '<i class="pi pi-check"></i>';
              setTimeout(() => {
                btn.innerHTML = '<i class="pi pi-clone"></i>';
              }, 1500);
            });
          }
        });
      `}
    </Script>
  )
}
