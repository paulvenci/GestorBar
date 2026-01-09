<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <!-- Modal Panel -->
        <div class="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[380px]">
          
          <!-- Receipt Preview (Visual for user) -->
          <div ref="receiptContent" class="p-4 bg-white text-black font-mono leading-tight border-b-2 border-gray-100">
              <!-- Header -->
              <div class="text-center mb-4">
                  <h2 class="text-2xl font-bold uppercase mb-2">{{ businessName }}</h2>
                  <p class="text-lg font-bold mb-3">VENTA #{{ String(transactionData.numero || '---').padStart(6, '0') }}</p>
                  <p class="text-xs">RUT: 76.XXX.XXX-X</p>
                  <p class="text-xs">Direccion del Local 123</p>
                  <p class="text-xs mb-2">Tel: +56 9 1234 5678</p>
                  
                  <hr class="border-black border-dashed my-2 border-t-2" />
                  
                  <div class="flex justify-between text-xs">
                      <span>Folio: #{{ transactionData.numero || '---' }}</span>
                      <span>{{ formatDate(transactionData.fecha) }}</span>
                  </div>
              </div>

              <!-- Items -->
              <div class="mb-4">
                  <table class="w-full text-sm">
                      <thead>
                          <tr class="border-b-2 border-black">
                              <th class="text-left py-2 font-bold">Cant</th>
                              <th class="text-left py-2 font-bold">Descripción</th>
                              <th class="text-right py-2 font-bold">Total</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="item in transactionData.items" :key="item.id" class="border-b border-gray-300">
                              <td class="py-2 w-12 align-top font-bold text-base">{{ item.cantidad }}x</td>
                              <td class="py-2 align-top">
                                  <div class="font-medium">{{ item.nombre_producto }}</div>
                              </td>
                              <td class="py-2 text-right align-top font-semibold">${{ formatNumber(item.subtotal) }}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <hr class="border-black border-dashed my-3 border-t-2" />

              <!-- Totals -->
              <div class="flex flex-col gap-2 text-sm">
                  <div class="flex justify-between">
                      <span>Subtotal:</span>
                      <span class="font-medium">${{ formatNumber(transactionData.subtotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                      <span>IVA (19%):</span>
                      <span class="font-medium">${{ formatNumber(transactionData.iva) }}</span>
                  </div>
                  <div v-if="transactionData.descuento > 0" class="flex justify-between font-bold">
                       <span>Descuento:</span>
                       <span>-${{ formatNumber(transactionData.descuento) }}</span>
                  </div>
                  <div class="flex justify-between font-extrabold text-xl mt-2 pt-2 border-t-2 border-black">
                      <span>TOTAL:</span>
                      <span>${{ formatNumber(transactionData.total) }}</span>
                  </div>
              </div>

              <hr class="border-black border-dashed my-3 border-t-2" />

              <!-- Footer -->
               <div class="text-center text-xs space-y-1">
                  <p class="font-semibold">Método de Pago: {{ transactionData.metodo_pago }}</p>
                  <p v-if="transactionData.cliente_nombre">Cliente: {{ transactionData.cliente_nombre }}</p>
                  <br />
                  <p class="whitespace-pre-line text-sm">{{ configStore.ticketMensajePie }}</p>
               </div>
          </div>

          <!-- Action Buttons -->
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse border-t">
            <button 
              @click="printReceipt"
              type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              🖨️ Imprimir
            </button>
            <button 
              @click="$emit('close')"
              type="button" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useConfiguracionStore } from '@/stores/configuracion'

const props = defineProps<{
  transactionData: any 
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const configStore = useConfiguracionStore()
const businessName = configStore.nombreNegocio || 'Bar Gordy'
const receiptContent = ref<HTMLDivElement | null>(null)

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CL').format(num)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('es-CL', { 
    day: '2-digit', month: '2-digit', year: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  })
}

// ✨ Iframe Printing Strategy ✨
const printReceipt = () => {
    if (!receiptContent.value) return;

    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 2. Get the content
    const content = receiptContent.value.innerHTML;

    // 3. Write content to iframe document
    // Get width from store (default to 80mm if missing)
    const ticketWidth = configStore.ticketAncho || '80mm';

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Comprobante ${props.transactionData.numero}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 14px;
                        line-height: 1.4;
                        margin: 0;
                        padding: 0;
                        width: ${ticketWidth};
                        color: #000;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .mb-1 { margin-bottom: 4px; }
                    .mb-2 { margin-bottom: 8px; }
                    .mb-3 { margin-bottom: 12px; }
                    .mb-4 { margin-bottom: 20px; }
                    .mt-1 { margin-top: 4px; }
                    .mt-2 { margin-top: 8px; }
                    .my-2 { margin-top: 8px; margin-bottom: 8px; }
                    .my-3 { margin-top: 12px; margin-bottom: 12px; }
                    .pt-2 { padding-top: 8px; }
                    .py-2 { padding-top: 6px; padding-bottom: 6px; }
                    .font-bold { font-weight: bold; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    .font-extrabold { font-weight: 900; }
                    .text-2xl { font-size: 22px; font-weight: bold; }
                    .text-xl { font-size: 20px; font-weight: bold; }
                    .text-lg { font-size: 18px; }
                    .text-base { font-size: 16px; }
                    .text-sm { font-size: 13px; }
                    .text-xs { font-size: 11px; }
                    .uppercase { text-transform: uppercase; }
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .justify-between { justify-content: space-between; }
                    .gap-1 { gap: 4px; }
                    .gap-2 { gap: 8px; }
                    .w-12 { width: 48px; }
                    
                    table { width: 100%; border-collapse: collapse; }
                    td, th { vertical-align: top; padding: 4px 0; }
                    
                    .border-b { border-bottom: 1px solid #ccc; }
                    .border-b-2 { border-bottom: 2px solid #000; }
                    .border-t-2 { border-top: 2px dashed #000; }
                    hr.border-dashed { border: none; border-top: 2px dashed #000; margin: 12px 0; }
                    
                    .space-y-1 > * + * { margin-top: 4px; }
                    .visible { visibility: visible !important; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        doc.close();

        // 4. Print after content is loaded
        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error("Print error", e);
            } finally {
                // remove iframe after print dialog closes (approximate)
                // In many browsers print() blocks, so this runs after close.
                // But to be safe, we can set a timeout or just leave it until next reload (it's hidden/empty)
                setTimeout(() => {
                   document.body.removeChild(iframe);
                }, 1000);
            }
        };
       
        // Fallback if onload doesn't fire immediately (sometimes cached)
        if (iframe.contentWindow && iframe.contentDocument?.readyState === 'complete') {
             iframe.onload(new Event('load'));
        }
    }
}
</script>
