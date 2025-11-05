        // ============================================
        // FULLSCREEN MODE FOR ZEBRA MC330M
        // Forces Chrome into fullscreen mode to maximize usable screen space
        // on the 4-inch display
        // ============================================
        
        /**
         * Attempts to enable fullscreen mode in the browser
         * This is particularly useful for the Zebra MC330M to maximize screen real estate
         */
        function enableFullscreen() {
            try {
                const elem = document.documentElement;
                
                // Try different fullscreen APIs for cross-browser compatibility
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(err => {
                        console.log('Fullscreen request failed:', err);
                    });
                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen();
                }
                
                console.log('Fullscreen mode requested for Zebra MC330M');
            } catch (err) {
                console.warn('Could not enable fullscreen:', err);
            }
        }
        
        /**
         * Checks if device is running Chrome browser
         * Used to conditionally enable fullscreen mode
         */
        function isChromeBrowser() {
            const userAgent = navigator.userAgent.toLowerCase();
            return userAgent.includes('chrome') && !userAgent.includes('edge');
        }
        
        /**
         * Initializes fullscreen mode on user interaction
         * Note: Fullscreen API requires user gesture (click/touch)
         */
        function initFullscreenMode() {
            // Only enable fullscreen on Chrome browsers and mobile devices
            if (isChromeBrowser() && window.innerWidth <= 800) {
                // Wait for first user interaction before requesting fullscreen
                const triggerFullscreen = () => {
                    enableFullscreen();
                    // Remove listener after first trigger
                    document.removeEventListener('click', triggerFullscreen);
                    document.removeEventListener('touchstart', triggerFullscreen);
                };
                
                // Listen for user interaction to trigger fullscreen
                document.addEventListener('click', triggerFullscreen, { once: true });
                document.addEventListener('touchstart', triggerFullscreen, { once: true });
                
                console.log('Fullscreen will be triggered on first user interaction');
            }
        }
        
        // ============================================
        // FIREBASE CONFIGURATION
        // ============================================
        
        // ==== Firebase (reemplaza con tus credenciales reales) ====
        let database = null;
        try {
            const firebaseConfig = {
                apiKey: "TU_API_KEY_AQUI",
                authDomain: "catalogomexiquense.firebaseapp.com",
                databaseURL: "https://catalogomexiquense-default-rtdb.firebaseio.com",
                projectId: "catalogomexiquense",
                storageBucket: "catalogomexiquense.appspot.com",
                messagingSenderId: "TU_SENDER_ID_AQUI",
                appId: "TU_APP_ID_AQUI"
            };
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(firebaseConfig);
                database = firebase.database();
            }
        } catch(err) {
            console.warn('Firebase not available, using localStorage only', err);
        }

        // ==== Catálogo de productos para búsqueda por UPC ====
        // Este array se utilizará para buscar productos por su código UPC completo
        // y auto-llenar los campos del formulario de créditos
        let catalogo = [];

        // ==== Estado ====
        const adminPassword = 'admin123';
        let products = [];
        const selection = new Set();
        let currentView = 'public';
        let currentPage = 1;
        const itemsPerPage = 20;

        // ==== DOM ====
        const productsContainer = document.getElementById('productsContainer');
        const searchInput = document.getElementById('searchInput');
        const publicSearchInput = document.getElementById('publicSearchInput');
        const adminView = document.getElementById('adminView');
        const publicView = document.getElementById('publicView');
        // Mobile menu buttons (now the primary navigation)
        const adminViewBtn = document.getElementById('adminViewBtnMobile');
        const publicViewBtn = document.getElementById('publicViewBtnMobile');
        const publicTabs = document.getElementById('publicTabs');
        const publicTabContent = document.getElementById('publicTabContent');
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        const addProductBtn = document.getElementById('addProductBtn');
        const passwordModal = document.getElementById('passwordModal');
        const adminPasswordInput = document.getElementById('adminPasswordInput');
        const confirmPassword = document.getElementById('confirmPassword');
        const cancelPassword = document.getElementById('cancelPassword');

        // Modales
        const productDetailModal = document.getElementById('productDetailModal');
        const productFormModal = document.getElementById('productFormModal');
        const importModal = document.getElementById('importModal');

        // Botones/controles admin
        const selectAll = document.getElementById('selectAll');
        const deleteSelected = document.getElementById('deleteSelected');
        const deleteProductBtn = document.getElementById('deleteProductBtn');

        // Campos personalizados
        const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
        const cancelCustomField = document.getElementById('cancelCustomField');
        const saveCustomField = document.getElementById('saveCustomField');

        // Formularios
        const productForm = document.getElementById('productForm');
        const importForm = document.getElementById('importForm');
        const customFieldForm = document.getElementById('customFieldForm');
        const customKey = document.getElementById('customKey');
        const customValue = document.getElementById('customValue');

        // Campos del modal de detalles
        const modalProductTitle = document.getElementById('modalProductTitle');
        const productItemNumber = document.getElementById('productItemNumber');
        const productUpc = document.getElementById('productUpc');
        const productSize = document.getElementById('productSize');
        const productQty = document.getElementById('productQty');
        const productDescription = document.getElementById('productDescription');
        const productCosto = document.getElementById('productCosto');
        const productImageSrc = document.getElementById('productImageSrc');
        const productImagePlaceholder = document.getElementById('productImagePlaceholder');

        // Formulario agregar/editar
        const productIdInput = document.getElementById('productId');
        const itemNumberInput = document.getElementById('itemNumber');
        const upcInput = document.getElementById('upc');
        const nombreInput = document.getElementById('nombre');
        const sizeInput = document.getElementById('size');
        const qtyInput = document.getElementById('qty');
        const costoInput = document.getElementById('costo');
        const urlInput = document.getElementById('url');
        const descriptionInput = document.getElementById('description');
        const formTitle = document.getElementById('formTitle');

        // Import CSV
        const csvFileInput = document.getElementById('csvFile');
        const fileNameText = document.getElementById('fileName');
        const importLoader = document.getElementById('importLoader');
        const importSubmitBtn = document.getElementById('importSubmitBtn');

        // Toast
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        // Pagination
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');
        const paginationControls = document.getElementById('paginationControls');

        // ==== Utils ====
        function generateId(){ return Date.now().toString(36) + Math.random().toString(36).substr(2); }
        function sanitizeInput(input){ if (!input) return ''; const div=document.createElement('div'); div.textContent=input; return div.innerHTML; }
        function formatCurrency(amount){ return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(amount); }
        function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }
        function isLocalStorageAvailable(){ try{ localStorage.setItem('__t','__t'); localStorage.removeItem('__t'); return true; }catch{ return false; } }

        // === NUEVO: ¿producto es "NEW"? (7 días) ===
        function isNewProduct(product){
            if(!product || !product.dateAdded) return false;
            const sevenDays = 7*24*60*60*1000;
            return (Date.now() - product.dateAdded) < sevenDays;
        }

        // ==== Sincronizar catálogo de UPC desde productos ====
        // Esta función actualiza el catálogo con los UPCs de los productos actuales
        function syncCatalogo() {
            catalogo = products
                .filter(p => p.upc) // Solo productos con UPC definido
                .map(p => ({
                    upc: p.upc,
                    nombre: p.nombre || 'Sin nombre',
                    itemNumber: p.itemNumber || '',
                    description: p.description || '',
                    size: p.size || '',
                    costo: p.costo || 0
                }));
            console.log(`Catálogo sincronizado con ${catalogo.length} productos`);
        }

        // ==== Load & Save ====
        function loadData(){
            try{
                if(database){
                    database.ref('products').on('value', (snapshot)=>{
                        products = snapshot.val() || [];
                        syncCatalogo(); // Sincronizar catálogo después de cargar productos
                        renderAdminProducts();
                        renderPublicTabs();
                        showToast('Datos sincronizados desde Firebase.');
                    });
                } else {
                    throw new Error('Firebase not available');
                }
            }catch(err){
                console.warn('Using localStorage for products', err);
                if(isLocalStorageAvailable()){
                    const stored = localStorage.getItem('products');
                    products = stored ? JSON.parse(stored) : [];
                    syncCatalogo(); // Sincronizar catálogo después de cargar productos
                    renderAdminProducts();
                    renderPublicTabs();
                } else { products = []; }
            }
        }
        function saveData(){
            return new Promise((resolve) => {
                try{ 
                    if(database) {
                        database.ref('products').set(products)
                            .then(() => {
                                console.log('Products saved to Firebase successfully');
                                syncCatalogo(); // Sincronizar catálogo después de guardar productos
                                if(isLocalStorageAvailable()) {
                                    localStorage.setItem('products', JSON.stringify(products));
                                }
                                resolve();
                            })
                            .catch((err) => {
                                console.warn('Firebase save error, using localStorage as fallback', err);
                                syncCatalogo(); // Sincronizar catálogo incluso con fallback
                                if(isLocalStorageAvailable()) {
                                    localStorage.setItem('products', JSON.stringify(products));
                                }
                                resolve(); // Resolve with localStorage fallback instead of rejecting
                            });
                    } else {
                        syncCatalogo(); // Sincronizar catálogo
                        if(isLocalStorageAvailable()) {
                            localStorage.setItem('products', JSON.stringify(products));
                        }
                        resolve();
                    }
                }
                catch(err){
                    console.error('Error saving products:', err);
                    syncCatalogo(); // Intentar sincronizar catálogo incluso con error
                    if(isLocalStorageAvailable()) {
                        localStorage.setItem('products', JSON.stringify(products));
                    }
                    resolve(); // Resolve to prevent UI from hanging on error
                }
            });
        }

        // ==== Render ADMIN (con selección Ctrl/Cmd + drag) ====
        function renderAdminProducts(){
            if(!productsContainer) return;
            productsContainer.innerHTML = '';
            const q = (searchInput?.value || '').toLowerCase();
            let filtered = [...products];
            if(q){
                filtered = filtered.filter(p=>{
                    try{
                        return p?.nombre?.toLowerCase().includes(q) || p?.itemNumber?.toLowerCase().includes(q) || p?.description?.toLowerCase().includes(q);
                    }catch{ return false; }
                });
            }
            if(filtered.length===0){
                productsContainer.innerHTML = `<div class="col-span-full text-center py-12"><svg xmlns='http://www.w3.org/2000/svg' class='h-16 w-16 mx-auto text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/></svg><h3 class='mt-4 text-lg font-medium text-gray-900'>No se encontraron productos</h3><p class='mt-1 text-gray-500'>Intenta con otra búsqueda o agrega nuevos productos.</p></div>`;
                updateDeleteButton();
                return;
            }
            filtered.forEach(product=>{
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 card-hover relative';
                card.dataset.id = product.id;
                if(selection.has(product.id)) card.classList.add('selected-card');
                card.innerHTML = `
                    <div class='product-image-container relative'>
                        <img src='${product.url || 'https://placehold.co/300x200/png?text=Sin+Imagen'}' alt='${sanitizeInput(product.nombre || 'Producto')}' class='product-image' onerror="this.onerror=null; this.src='https://placehold.co/300x200/png?text=Error+al+cargar';">
                    </div>
                    <div class='p-5'>
                        <h3 class='text-lg font-semibold text-gray-900 mb-2'>${sanitizeInput(product.nombre || 'Sin nombre')}</h3>
                        <div class='flex justify-center'>
                            <button class='view-details bg-mexican-green hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all' data-id='${product.id}'>Ver detalles</button>
                        </div>
                    </div>`;
                // Selección Ctrl/Cmd
                card.addEventListener('click', (e)=>{
                    if(e.ctrlKey || e.metaKey){ e.preventDefault(); e.stopPropagation(); toggleSelection(product.id, card); return; }
                });
                productsContainer.appendChild(card);
            });
            updateDeleteButton();
        }

        // ==== Render PUBLIC (NEW solo aquí) ====
        function renderPublicTabs(searchTerm=''){
            publicTabs.innerHTML = '';
            publicTabContent.innerHTML = '';
            publicTabContent.className = 'mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

            let filtered = [...products];
            if(searchTerm){
                const s = searchTerm.toLowerCase();
                filtered = filtered.filter(p=> p?.nombre?.toLowerCase().includes(s) || p?.upc?.toLowerCase().includes(s));
            }
            if(filtered.length===0){
                publicTabContent.innerHTML = `<div class='col-span-full text-center py-12'><svg xmlns='http://www.w3.org/2000/svg' class='h-16 w-16 mx-auto text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/></svg><h3 class='mt-4 text-lg font-medium text-gray-900'>No se encontraron productos</h3><p class='mt-1 text-gray-500'>Intenta con otra búsqueda.</p></div>`;
                paginationControls.style.display = 'none';
                return;
            }
            // Orden: nuevos primero, viejos aleatorios
            const newOnes = filtered.filter(isNewProduct);
            const oldOnes = filtered.filter(p=> !isNewProduct(p));
            for(let i=oldOnes.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [oldOnes[i], oldOnes[j]]=[oldOnes[j], oldOnes[i]]; }
            const ordered = [...newOnes, ...oldOnes];

            // Pagination logic
            const totalPages = Math.ceil(ordered.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            if (currentPage < 1) {
                currentPage = 1;
            }
            
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedProducts = ordered.slice(startIndex, endIndex);

            renderPublicProducts(paginatedProducts, publicTabContent);
            renderPagination(totalPages, ordered.length);
        }

        function renderPublicProducts(list, container){
            container.innerHTML = '';
            list.forEach(product=>{
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 card-hover';
                card.innerHTML = `
                    <div class='product-image-container relative'>
                        ${isNewProduct(product) ? `<span class='absolute top-2 left-2 bg-mexican-green text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse'>NEW</span>` : ''}
                        <img src='${product.url || 'https://placehold.co/300x200/png?text=Sin+Imagen'}' alt='${sanitizeInput(product.nombre || 'Producto')}' class='product-image' onerror="this.onerror=null; this.src='https://placehold.co/300x200/png?text=Error+al+cargar';">
                    </div>
                    <div class='p-5'>
                        <h3 class='text-lg font-semibold text-gray-900 mb-2'>${sanitizeInput(product.nombre || 'Sin nombre')}</h3>
                        <div class='flex justify-center'>
                            <button class='view-details bg-mexican-green hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all' data-id='${product.id}'>Ver detalles</button>
                        </div>
                    </div>`;
                container.appendChild(card);
            });
        }

        function renderPagination(totalPages, totalItems){
            if (totalPages <= 1) {
                paginationControls.style.display = 'none';
                return;
            }
            
            paginationControls.style.display = 'flex';
            
            // Update prev/next buttons
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
            
            // Render page numbers
            pageNumbers.innerHTML = '';
            
            // Show page info
            const pageInfo = document.createElement('div');
            pageInfo.className = 'flex items-center gap-2 px-4 py-2 text-gray-700 font-medium';
            pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} productos)`;
            pageNumbers.appendChild(pageInfo);
            
            // Show max 5 page numbers around current page
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // Adjust start if we're near the end
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            // Add first page and ellipsis if needed
            if (startPage > 1) {
                addPageButton(1);
                if (startPage > 2) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'px-2 text-gray-500';
                    ellipsis.textContent = '...';
                    pageNumbers.appendChild(ellipsis);
                }
            }
            
            // Add visible page numbers
            for (let i = startPage; i <= endPage; i++) {
                addPageButton(i);
            }
            
            // Add last page and ellipsis if needed
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'px-2 text-gray-500';
                    ellipsis.textContent = '...';
                    pageNumbers.appendChild(ellipsis);
                }
                addPageButton(totalPages);
            }
        }
        
        function addPageButton(pageNum) {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 rounded-lg font-medium transition-all ${
                pageNum === currentPage 
                    ? 'bg-mexican-green text-white' 
                    : 'bg-white text-mexican-green hover:bg-gray-100 border border-mexican-green'
            }`;
            btn.textContent = pageNum;
            btn.addEventListener('click', () => {
                currentPage = pageNum;
                renderPublicTabs(publicSearchInput?.value || '');
                // Scroll to top of products
                publicView.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            pageNumbers.appendChild(btn);
        }

        // ==== Selección (admin) ====
        function toggleSelection(id, cardEl){ if(selection.has(id)) selection.delete(id); else selection.add(id); if(cardEl) cardEl.classList.toggle('selected-card'); updateDeleteButton(); }
        function clearSelection(){ selection.clear(); document.querySelectorAll('#productsContainer [data-id]').forEach(c=>c.classList.remove('selected-card')); updateDeleteButton(); }
        function updateDeleteButton(){ deleteSelected.disabled = selection.size===0; const total=document.querySelectorAll('#productsContainer [data-id]').length; const selected=document.querySelectorAll('#productsContainer .selected-card').length; selectAll.checked = total>0 && selected===total; }

        // ==== Detalles ====
        function showProductDetails(productId){
            const product = products.find(p=> p.id===productId);
            if(!product){ showToast('Producto no encontrado.', true); return; }
            try{
                modalProductTitle.textContent = sanitizeInput(product.nombre || 'Sin nombre');
                productItemNumber.textContent = sanitizeInput(product.itemNumber || 'N/A');
                productUpc.textContent = sanitizeInput(product.upc || 'N/A');
                productSize.textContent = sanitizeInput(product.size || 'N/A');
                productQty.textContent = sanitizeInput(String(product.qty ?? 'N/A'));
                productDescription.textContent = sanitizeInput(product.description || 'Sin descripción');
                productCosto.textContent = formatCurrency(product.costo || 0);

                if(product.url){
                    productImageSrc.src = product.url;
                    productImageSrc.onerror = ()=>{ productImageSrc.classList.add('hidden'); productImagePlaceholder.classList.remove('hidden'); };
                    productImageSrc.classList.remove('hidden');
                    productImagePlaceholder.classList.add('hidden');
                }else{
                    productImageSrc.classList.add('hidden');
                    productImagePlaceholder.classList.remove('hidden');
                }
                // Custom fields
                const customFieldsContainer = document.getElementById('customFields');
                customFieldsContainer.innerHTML = '';
                const customFields = product.customFields || {};
                Object.entries(customFields).forEach(([k,v])=>{
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${sanitizeInput(k)}:</strong> <span class='text-gray-700'>${sanitizeInput(v)}</span>`;
                    customFieldsContainer.appendChild(p);
                });
                deleteProductBtn.dataset.id = product.id;
                document.querySelectorAll('.admin-only').forEach(el=> el.style.display = currentView==='admin' ? '' : 'none');
                productDetailModal.classList.remove('hidden');
            }catch(e){ console.error('Error mostrando detalles:', e); showToast('Error al mostrar detalles.', true); }
        }
// ==== Import CSV ====
function importFromCSV(file) {
  try {
    if (!window.Papa) {
      showToast('Error: PapaParse no se cargó.', true);
      return;
    }

    importLoader.classList.remove('hidden');
    importSubmitBtn.disabled = true;

    const reader = new FileReader();

    reader.onload = function(e) {
      let text = e.target.result;

      // 💡 Eliminar BOM si viene de Numbers
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

      // 🔍 Detectar delimitador automáticamente
      const firstLine = text.split('\n')[0];
      let delimiter = ';';
      if ((firstLine.match(/,/g) || []).length > (firstLine.match(/;/g) || []).length) delimiter = ',';
      if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/;/g) || []).length) delimiter = '\t';

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        delimiter: delimiter,
        transformHeader: (header) => header.trim().replace(/["']/g, '').toUpperCase(), // 💪 Limpieza total de encabezados
        complete: (results) => {
          const imported = [];
          let errors = 0;

          if (!results.data || results.data.length === 0) {
            showToast('El archivo está vacío o tiene formato incorrecto.', true);
            importLoader.classList.add('hidden');
            importSubmitBtn.disabled = false;
            return;
          }

          results.data.forEach((row, idx) => {
            try {
              if (!row || Object.values(row).every(v => v === '')) return;

              // Normalizamos las claves del objeto row
              const cleanRow = {};
              for (const [key, val] of Object.entries(row)) {
                cleanRow[key.trim().toUpperCase()] = val;
              }

              const newProduct = {
                id: generateId(),
                itemNumber: sanitizeInput(String(cleanRow['ITEM NUMBER'] || '').trim()),
                description: sanitizeInput(String(cleanRow['DESCRIPTION'] || '').trim()),
                upc: sanitizeInput(String(cleanRow['UPC'] || '').trim()),
                nombre: sanitizeInput(String(cleanRow['NOMBRE'] || '').trim()),
                size: cleanRow['SIZE'] ? sanitizeInput(String(cleanRow['SIZE']).trim()) : null,
                qty: cleanRow['QTY'] && !isNaN(cleanRow['QTY']) ? parseInt(cleanRow['QTY']) : 0,
                costo: cleanRow['COSTO'] && !isNaN(parseFloat(String(cleanRow['COSTO']).replace(',', '.')))
                  ? parseFloat(String(cleanRow['COSTO']).replace(',', '.'))
                  : 0,
                url: cleanRow['URL'] ? sanitizeInput(String(cleanRow['URL']).trim()) : '',
                proveedor: cleanRow['PALIMEX'] ? sanitizeInput(String(cleanRow['PALIMEX']).trim()) : '',
                customFields: {},
                dateAdded: Date.now()
              };

              // Guarda PALIMEX también como customField si existe
              if (cleanRow['PALIMEX']) {
                newProduct.customFields['PALIMEX'] = sanitizeInput(String(cleanRow['PALIMEX']).trim());
              }

              // Guardar campos extra como personalizados
              for (const [key, val] of Object.entries(cleanRow)) {
                if (!['ITEM NUMBER','DESCRIPTION','UPC','NOMBRE','SIZE','QTY','COSTO','URL','PALIMEX'].includes(key)) {
                  if (val != null && val !== '') {
                    newProduct.customFields[sanitizeInput(key)] = sanitizeInput(String(val).trim());
                  }
                }
              }

              // Actualizar o agregar producto
              const existing = products.find(p =>
                (p.itemNumber && p.itemNumber === newProduct.itemNumber) ||
                (p.upc && p.upc === newProduct.upc)
              );

              if (existing) {
                Object.assign(existing, { ...newProduct, dateAdded: existing.dateAdded || newProduct.dateAdded });
              } else {
                imported.push(newProduct);
              }

            } catch (e) {
              console.error(`Error en fila ${idx + 1}:`, e);
              errors++;
            }
          });

          products = [...products, ...imported];
          saveData();
          renderAdminProducts();
          renderPublicTabs();

          const msg = errors > 0
            ? `Importados ${imported.length} productos, ${errors} errores.`
            : `Importados ${imported.length} productos correctamente.`;
          showToast(msg, errors > 0);

          importModal.classList.add('hidden');
          importLoader.classList.add('hidden');
          importSubmitBtn.disabled = false;
        },
        error: (err) => {
          console.error('CSV parse error:', err);
          showToast('Error al procesar el CSV.', true);
          importLoader.classList.add('hidden');
          importSubmitBtn.disabled = false;
        }
      });
    };

    reader.readAsText(file, 'UTF-8');
  } catch (e) {
    console.error('Import error:', e);
    showToast('Error al importar CSV.', true);
    importLoader.classList.add('hidden');
    importSubmitBtn.disabled = false;
  }
}
        // ==== Validación + libs + vistas ====
        function validateForm(_, fields){
            let ok=true;
            fields.forEach(f=>{
                const el=document.getElementById(f.id); const errEl=document.getElementById(`${f.id}Error`);
                if(!el||!errEl) return; errEl.classList.add('hidden'); errEl.textContent='';
                if(f.required && !el.value.trim()){ errEl.textContent=`${f.label} es obligatorio.`; errEl.classList.remove('hidden'); ok=false; }
                else if(f.type==='number' && el.value && isNaN(parseFloat(el.value))){ errEl.textContent=`Ingresa un número válido para ${f.label}.`; errEl.classList.remove('hidden'); ok=false; }
                else if(f.type==='int' && el.value && !Number.isInteger(parseFloat(el.value))){ errEl.textContent=`${f.label} debe ser entero.`; errEl.classList.remove('hidden'); ok=false; }
                else if(f.min!=null && parseFloat(el.value)<f.min){ errEl.textContent=`${f.label} debe ser ≥ ${f.min}.`; errEl.classList.remove('hidden'); ok=false; }
            });
            return ok;
        }
        function checkLibraries(){ if(!window.Papa) showToast('Error: PapaParse no se cargó.', true); if(!window.jspdf || !window.html2canvas) showToast('Error: librerías PDF no cargadas.', true); }
        function showView(view){ 
            currentView=view; 
            document.getElementById('creditosView').classList.add('hidden');
            document.getElementById('especialesView').classList.add('hidden');
            if(view==='admin'){ 
                adminView.classList.remove('hidden'); 
                publicView.classList.add('hidden'); 
            } else { 
                adminView.classList.add('hidden'); 
                publicView.classList.remove('hidden'); 
            }
            updateHeaderButtons();
        }

        // ==== Export PDF ====
        function exportToPDF(){
            try{
                if(!window.jspdf){ showToast('No se pudo cargar jsPDF.', true); return; }
                const { jsPDF } = window.jspdf;
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<div class="loader inline-block"></div> Exportando...';
                const doc = new jsPDF();
                doc.autoTable({
                    head: [[ 'Nombre','Descripción','Número de Ítem','UPC','Tamaño','Cantidad','Costo' ]],
                    body: products.map(p=> [ sanitizeInput(p.nombre||'N/A'), sanitizeInput(p.description||'N/A'), sanitizeInput(p.itemNumber||'N/A'), sanitizeInput(p.upc||'N/A'), sanitizeInput(p.size||'N/A'), sanitizeInput(p.qty||'N/A'), formatCurrency(p.costo||0) ]),
                    theme: 'grid', headStyles:{ fillColor:[99,102,241] }, styles:{ font:'helvetica', fontSize:10 }, margin:{ top:20 },
                    didDrawPage: (data)=>{ if(data.pageNumber===1){ doc.setFontSize(18); doc.text('Catálogo de Productos', data.settings.margin.left, 10); doc.setFontSize(10); doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')}`, data.settings.margin.left, 15); } }
                });
                doc.save('catalogo-productos.pdf');
                showToast('Catálogo exportado correctamente a PDF.');
            }catch(e){ console.error('PDF error:', e); showToast('Error al generar el PDF.', true); }
            finally{ exportBtn.disabled=false; exportBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>Exportar PDF`; }
        }

        // ==== Toast ====
        function showToast(message, isError=false){
            toastMessage.textContent = message;
            toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center z-50 ${isError ? 'bg-red-600' : 'bg-gray-800'} text-white`;
            toast.classList.remove('translate-y-20','opacity-0');
            setTimeout(()=> toast.classList.add('translate-y-20','opacity-0'), 3000);
        }

        // ==== Eventos ====
        function setupEventListeners(){
            // Búsquedas
            if(searchInput) searchInput.addEventListener('input', debounce(renderAdminProducts, 300));
            publicSearchInput.addEventListener('input', debounce(()=> {
                currentPage = 1; // Reset to first page on new search
                renderPublicTabs(sanitizeInput(publicSearchInput.value));
            }, 300));

            // Pagination
            if(prevPageBtn) {
                prevPageBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPublicTabs(publicSearchInput?.value || '');
                        publicView.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
            if(nextPageBtn) {
                nextPageBtn.addEventListener('click', () => {
                    if (!nextPageBtn.disabled) {
                        currentPage++;
                        renderPublicTabs(publicSearchInput?.value || '');
                        publicView.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }

            // Cierre modales
            document.getElementById('closeDetailModal').addEventListener('click', ()=> productDetailModal.classList.add('hidden'));
            document.getElementById('closeFormModal').addEventListener('click', ()=> productFormModal.classList.add('hidden'));
            document.getElementById('cancelProductBtn').addEventListener('click', ()=> productFormModal.classList.add('hidden'));
            document.getElementById('closeImportModal').addEventListener('click', ()=> importModal.classList.add('hidden'));

            // Nuevo producto
            addProductBtn.addEventListener('click', ()=>{ productForm.reset(); productIdInput.value=''; formTitle.textContent='Nuevo Producto'; productFormModal.classList.remove('hidden'); });

            // Import CSV
            importBtn.addEventListener('click', ()=>{ importForm.reset(); fileNameText.textContent='Ningún archivo seleccionado'; importModal.classList.remove('hidden'); });
            importForm.addEventListener('submit', (e)=>{ e.preventDefault(); const f=csvFileInput.files?.[0]; if(f) importFromCSV(f); else showToast('Selecciona un archivo CSV.', true); });
            csvFileInput.addEventListener('change', (e)=>{ fileNameText.textContent = sanitizeInput(e.target.files[0]?.name || 'Ningún archivo seleccionado'); });

            // Export PDF
            exportBtn.addEventListener('click', exportToPDF);

            // Delegación ver detalles
            productsContainer.addEventListener('click', (e)=>{ const btn=e.target.closest('.view-details'); if(btn) showProductDetails(btn.dataset.id); });
            publicTabContent.addEventListener('click', (e)=>{ const btn=e.target.closest('.view-details'); if(btn) showProductDetails(btn.dataset.id); });

            // Eliminar individual desde modal
            deleteProductBtn.addEventListener('click', ()=>{
                const id = deleteProductBtn.dataset.id;
                if(confirm('¿Eliminar este producto?')){
                    products = products.filter(p=> p.id!==id);
                    saveData(); renderAdminProducts(); renderPublicTabs(); productDetailModal.classList.add('hidden'); showToast('Producto eliminado correctamente.');
                    if(selection.has(id)) selection.delete(id); updateDeleteButton();
                }
            });

            // Custom fields
            addCustomFieldBtn.addEventListener('click', ()=>{ customFieldForm.classList.remove('hidden'); addCustomFieldBtn.classList.add('hidden'); customKey.value=''; customValue.value=''; saveCustomField.disabled=true; });
            cancelCustomField.addEventListener('click', ()=>{ customFieldForm.classList.add('hidden'); addCustomFieldBtn.classList.remove('hidden'); });
            function updateSaveCustomButton(){ saveCustomField.disabled = !(customKey.value.trim() && customValue.value.trim()); }
            customKey.addEventListener('input', updateSaveCustomButton); customValue.addEventListener('input', updateSaveCustomButton);
            saveCustomField.addEventListener('click', ()=>{
                const key=sanitizeInput(customKey.value.trim()); const value=sanitizeInput(customValue.value.trim()); if(!key){ showToast('La clave es obligatoria.', true); return; }
                const id=deleteProductBtn.dataset.id; const product=products.find(p=> p.id===id);
                if(product){ if(!product.customFields) product.customFields={}; product.customFields[key]=value; saveData(); showProductDetails(id); customFieldForm.classList.add('hidden'); addCustomFieldBtn.classList.remove('hidden'); showToast('Campo personalizado agregado.'); renderAdminProducts(); renderPublicTabs(); }
            });

            // Vista admin/public
            adminViewBtn.addEventListener('click', ()=>{ passwordModal.classList.remove('hidden'); adminPasswordInput.focus(); closeMobileMenu(); });
            publicViewBtn.addEventListener('click', ()=> { showView('public'); closeMobileMenu(); });
            confirmPassword.addEventListener('click', ()=>{ if(adminPasswordInput.value===adminPassword){ passwordModal.classList.add('hidden'); showView('admin'); } else showToast('Contraseña incorrecta.', true); adminPasswordInput.value=''; });
            cancelPassword.addEventListener('click', ()=>{ passwordModal.classList.add('hidden'); adminPasswordInput.value=''; });
            adminPasswordInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') confirmPassword.click(); });

            // Seleccionar todos
            selectAll.addEventListener('change', (e)=>{
                const cards=document.querySelectorAll('#productsContainer [data-id]');
                if(e.target.checked){ cards.forEach(card=>{ const id=card.dataset.id; if(!selection.has(id)) selection.add(id); card.classList.add('selected-card'); }); }
                else { clearSelection(); }
                updateDeleteButton();
            });
            // Eliminar seleccionados
            deleteSelected.addEventListener('click', ()=>{ if(selection.size===0) return; if(!confirm(`¿Eliminar ${selection.size} productos seleccionados?`)) return; const ids=new Set(selection); products = products.filter(p=> !ids.has(p.id)); saveData(); renderAdminProducts(); renderPublicTabs(); clearSelection(); showToast('Productos eliminados correctamente.'); });

            // Cerrar modales clic fuera
            window.addEventListener('click', (e)=>{ if(e.target===productDetailModal) productDetailModal.classList.add('hidden'); if(e.target===productFormModal) productFormModal.classList.add('hidden'); if(e.target===importModal) importModal.classList.add('hidden'); if(e.target===passwordModal) passwordModal.classList.add('hidden'); });

            // Guardar producto (alta/edición)
            productForm.addEventListener('submit', (e)=>{
                e.preventDefault();
                const fields=[
                    { id:'itemNumber', label:'Número de Ítem', required:true },
                    { id:'upc', label:'UPC', required:true },
                    { id:'nombre', label:'Nombre', required:true },
                    { id:'size', label:'Tamaño', required:true },
                    { id:'qty', label:'Cantidad', required:true, type:'int', min:0 },
                    { id:'costo', label:'Costo', required:true, type:'number', min:0 },
                    { id:'description', label:'Descripción', required:true }
                ];
                if(!validateForm('productForm', fields)) return;
                const productId=productIdInput.value;
                const newProduct={
                    id: productId || generateId(),
                    itemNumber: sanitizeInput(itemNumberInput.value),
                    description: sanitizeInput(descriptionInput.value),
                    upc: sanitizeInput(upcInput.value),
                    nombre: sanitizeInput(nombreInput.value),
                    size: sanitizeInput(sizeInput.value),
                    qty: parseInt(qtyInput.value),
                    costo: parseFloat(costoInput.value),
                    url: urlInput.value || '',
                    customFields: {},
                    dateAdded: Date.now() // NUEVO: necesario para badge "NEW"
                };
                if(productId){
                    const p = products.find(x=> x.id===productId);
                    if(p){ newProduct.customFields = p.customFields || {}; newProduct.dateAdded = p.dateAdded || newProduct.dateAdded; Object.assign(p, newProduct); }
                } else { products.push(newProduct); }
                saveData(); renderAdminProducts(); renderPublicTabs(); showToast(productId ? 'Producto actualizado correctamente.' : 'Producto agregado correctamente.'); productFormModal.classList.add('hidden');
            });
        }

        // ==== Drag selection (admin) ====
        (function enableDragSelection(){
            let isDragging=false, startX=0, startY=0, selectionBox=null;
            const container = document.getElementById('productsContainer');
            if(!container) return;
            container.addEventListener('mousedown', (e)=>{
                if(e.target.closest('button') || e.target.closest('input') || e.target.closest('svg')) return;
                isDragging=true; startX=e.pageX; startY=e.pageY;
                selectionBox=document.createElement('div');
                Object.assign(selectionBox.style,{ position:'absolute', border:'2px solid rgba(59,130,246,0.7)', background:'rgba(59,130,246,0.2)', pointerEvents:'none', zIndex:'9999' });
                document.body.appendChild(selectionBox);
            });
            document.addEventListener('mousemove', (e)=>{
                if(!isDragging||!selectionBox) return; const x1=Math.min(e.pageX,startX), y1=Math.min(e.pageY,startY), x2=Math.max(e.pageX,startX), y2=Math.max(e.pageY,startY);
                selectionBox.style.left=`${x1}px`; selectionBox.style.top=`${y1}px`; selectionBox.style.width=`${x2-x1}px`; selectionBox.style.height=`${y2-y1}px`;
            });
            document.addEventListener('mouseup', ()=>{
                if(!isDragging) return; isDragging=false; if(selectionBox){ const rect=selectionBox.getBoundingClientRect(); document.querySelectorAll('#productsContainer [data-id]').forEach(card=>{ const cr=card.getBoundingClientRect(); const overlap = !(rect.right<cr.left || rect.left>cr.right || rect.bottom<cr.top || rect.top>cr.bottom); if(overlap){ const id=card.dataset.id; selection.add(id); card.classList.add('selected-card'); } }); updateDeleteButton(); document.body.removeChild(selectionBox); selectionBox=null; }
            });
            document.addEventListener('mouseleave', ()=>{ if(isDragging){ isDragging=false; if(selectionBox){ document.body.removeChild(selectionBox); selectionBox=null; } } });
            document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && selectionBox){ isDragging=false; document.body.removeChild(selectionBox); selectionBox=null; } });
        })();

        // ==== Edición inline del Item Code (solo admin) ====
        (function enableInlineItemEdit(){
            const itemSpan = document.getElementById('productItemNumber'); if(!itemSpan) return;
            itemSpan.addEventListener('click', ()=>{
                if(currentView!=='admin') return;
                const currentValue=itemSpan.textContent.trim();
                const input=document.createElement('input'); input.type='text'; input.value=currentValue==='N/A' ? '' : currentValue; input.className='border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-mexican-green focus:border-transparent'; input.style.width='100px';
                itemSpan.replaceWith(input); input.focus();
                const saveChange=()=>{
                    const newValue=input.value.trim()||'N/A'; const productId=deleteProductBtn.dataset.id; const product=products.find(p=> p.id===productId); if(!product) return; product.itemNumber=newValue; saveData(); const newSpan=document.createElement('span'); newSpan.id='productItemNumber'; newSpan.className='text-gray-700 cursor-pointer'; newSpan.textContent=newValue; input.replaceWith(newSpan); showToast('Item Code actualizado correctamente.'); renderAdminProducts(); renderPublicTabs(); enableInlineItemEdit();
                };
                input.addEventListener('blur', saveChange); input.addEventListener('keypress', (e)=>{ if(e.key==='Enter') input.blur(); });
            });
        })();

        // ==== ESPECIALES FUNCTIONALITY ====
        let especiales = [];

        // Load especiales from Firebase with localStorage fallback
        function loadEspeciales() {
            try {
                if (database) {
                    database.ref('especiales').on('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data && Array.isArray(data) && data.length > 0) {
                            especiales = data;
                        } else {
                            // Initialize with simulated data
                            especiales = [
                                {
                                    id_price: 1,
                                    id_provider: 101,
                                    provider: 'Avocado',
                                    product: 'Pozole Juanitas',
                                    price: 5.99
                                },
                                {
                                    id_price: 2,
                                    id_provider: 102,
                                    provider: 'La Costeña',
                                    product: 'Frijoles Negros Refritos',
                                    price: 3.50
                                },
                                {
                                    id_price: 3,
                                    id_provider: 103,
                                    provider: 'Herdez',
                                    product: 'Salsa Verde 7oz',
                                    price: 2.99
                                },
                                {
                                    id_price: 4,
                                    id_provider: 101,
                                    provider: 'Avocado',
                                    product: 'Aguacate Fresco Orgánico',
                                    price: 4.25
                                },
                                {
                                    id_price: 5,
                                    id_provider: 104,
                                    provider: 'Maseca',
                                    product: 'Harina de Maíz 2kg',
                                    price: 6.99
                                },
                                {
                                    id_price: 6,
                                    id_provider: 105,
                                    provider: 'Bimbo',
                                    product: 'Pan Blanco Grande',
                                    price: 3.75
                                },
                                {
                                    id_price: 7,
                                    id_provider: 102,
                                    provider: 'La Costeña',
                                    product: 'Jalapeños en Rajas',
                                    price: 2.49
                                },
                                {
                                    id_price: 8,
                                    id_provider: 106,
                                    provider: 'Jumex',
                                    product: 'Néctar de Mango 1L',
                                    price: 1.99
                                }
                            ];
                            saveEspeciales();
                        }
                        // Render if we're in especiales view
                        if (currentView === 'especiales') {
                            renderEspeciales(document.getElementById('especialesSearchInput')?.value || '');
                        }
                        console.log('Especiales synchronized from Firebase.');
                    });
                } else {
                    throw new Error('Firebase not available');
                }
            } catch (err) {
                console.warn('Using localStorage for especiales', err);
                if (isLocalStorageAvailable()) {
                    const stored = localStorage.getItem('especiales');
                    if (stored) {
                        especiales = JSON.parse(stored);
                    } else {
                        // Initialize with simulated data
                        especiales = [
                            {
                                id_price: 1,
                                id_provider: 101,
                                provider: 'Avocado',
                                product: 'Pozole Juanitas',
                                price: 5.99
                            },
                            {
                                id_price: 2,
                                id_provider: 102,
                                provider: 'La Costeña',
                                product: 'Frijoles Negros Refritos',
                                price: 3.50
                            },
                            {
                                id_price: 3,
                                id_provider: 103,
                                provider: 'Herdez',
                                product: 'Salsa Verde 7oz',
                                price: 2.99
                            },
                            {
                                id_price: 4,
                                id_provider: 101,
                                provider: 'Avocado',
                                product: 'Aguacate Fresco Orgánico',
                                price: 4.25
                            },
                            {
                                id_price: 5,
                                id_provider: 104,
                                provider: 'Maseca',
                                product: 'Harina de Maíz 2kg',
                                price: 6.99
                            },
                            {
                                id_price: 6,
                                id_provider: 105,
                                provider: 'Bimbo',
                                product: 'Pan Blanco Grande',
                                price: 3.75
                            },
                            {
                                id_price: 7,
                                id_provider: 102,
                                provider: 'La Costeña',
                                product: 'Jalapeños en Rajas',
                                price: 2.49
                            },
                            {
                                id_price: 8,
                                id_provider: 106,
                                provider: 'Jumex',
                                product: 'Néctar de Mango 1L',
                                price: 1.99
                            }
                        ];
                        saveEspeciales();
                    }
                }
            }
        }

        // Save especiales to Firebase and localStorage
        function saveEspeciales() {
            return new Promise((resolve) => {
                try {
                    if (database) {
                        database.ref('especiales').set(especiales)
                            .then(() => {
                                console.log('Especiales saved to Firebase successfully');
                                if (isLocalStorageAvailable()) {
                                    localStorage.setItem('especiales', JSON.stringify(especiales));
                                }
                                resolve();
                            })
                            .catch((err) => {
                                console.warn('Firebase save error for especiales, using localStorage as fallback', err);
                                if (isLocalStorageAvailable()) {
                                    localStorage.setItem('especiales', JSON.stringify(especiales));
                                }
                                resolve(); // Resolve with localStorage fallback instead of rejecting
                            });
                    } else {
                        if (isLocalStorageAvailable()) {
                            localStorage.setItem('especiales', JSON.stringify(especiales));
                        }
                        resolve();
                    }
                } catch (err) {
                    console.error('Error saving especiales:', err);
                    if (isLocalStorageAvailable()) {
                        localStorage.setItem('especiales', JSON.stringify(especiales));
                    }
                    resolve(); // Resolve to prevent UI from hanging on error
                }
            });
        }

        // Show especiales view
        function showEspecialesView() {
            currentView = 'especiales';
            
            // Hide all main sections
            adminView.classList.add('hidden');
            publicView.classList.add('hidden');
            document.getElementById('creditosView').classList.add('hidden');
            document.getElementById('especialesView').classList.remove('hidden');
            
            renderEspeciales();
            updateHeaderButtons();
        }

        // Render especiales
        function renderEspeciales(searchTerm = '') {
            const container = document.getElementById('especialesContainer');
            container.innerHTML = '';
            
            let filtered = [...especiales];
            
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(e => 
                    e.provider.toLowerCase().includes(term) ||
                    e.product.toLowerCase().includes(term)
                );
            }
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">No se encontraron precios especiales</h3>
                        <p class="mt-1 text-gray-500">Intenta con otra búsqueda.</p>
                    </div>
                `;
                return;
            }
            
            filtered.forEach(especial => {
                const card = document.createElement('div');
                card.className = 'especiales-card';
                card.innerHTML = `
                    <div class="mb-4">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-grow">
                                <h3 class="text-xl font-bold text-mexican-green mb-1">${sanitizeInput(especial.provider)}</h3>
                                <p class="text-gray-700 font-medium mb-3">${sanitizeInput(especial.product)}</p>
                            </div>
                            <button class="delete-especial bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all" data-id="${especial.id_price}" title="Eliminar especial">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div class="flex items-center">
                            <span class="text-2xl font-bold text-mexican-green">${formatCurrency(especial.price)}</span>
                            <span class="price-indicator" title="Precio especial próximo"></span>
                        </div>
                    </div>
                `;
                
                container.appendChild(card);
            });
            
            // Setup delete button event listeners
            container.querySelectorAll('.delete-especial').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const especialId = parseInt(e.currentTarget.dataset.id, 10);
                    // Validate that the parse was successful and ID is positive
                    if (isNaN(especialId) || especialId <= 0) {
                        showToast('Error: ID de especial inválido', true);
                        return;
                    }
                    deleteEspecial(especialId);
                });
            });
        }

        // Helper function to get next ID from array
        function getNextId(array, idField, defaultStart = 1) {
            const validIds = array.filter(item => typeof item[idField] === 'number' && !isNaN(item[idField])).map(item => item[idField]);
            return validIds.length > 0 ? Math.max(...validIds) + 1 : defaultStart;
        }
        
        // Add new especial
        async function addEspecial(provider, product, price) {
            const newEspecial = {
                id_price: getNextId(especiales, 'id_price', 1),
                id_provider: getNextId(especiales, 'id_provider', 1),
                provider: provider,
                product: product,
                price: parseFloat(price)
            };
            
            especiales.push(newEspecial);
            
            // Wait for save to complete
            await saveEspeciales();
            
            renderEspeciales(document.getElementById('especialesSearchInput')?.value || '');
            showToast('Especial agregado correctamente');
        }
        
        // Delete especial
        async function deleteEspecial(especialId) {
            // Validate that especialId is a valid positive number
            if (typeof especialId !== 'number' || isNaN(especialId) || especialId <= 0) {
                showToast('Error: ID de especial inválido', true);
                return;
            }
            
            const especial = especiales.find(e => e.id_price === especialId);
            if (!especial) {
                showToast('Error: Especial no encontrado', true);
                return;
            }
            
            if (!confirm(`¿Estás seguro de eliminar el especial "${especial.product}" de ${especial.provider}?`)) {
                return;
            }
            
            especiales = especiales.filter(e => e.id_price !== especialId);
            
            // Wait for save to complete
            await saveEspeciales();
            
            renderEspeciales(document.getElementById('especialesSearchInput')?.value || '');
            showToast('Especial eliminado correctamente');
        }
        
        // Setup especiales event listeners
        function setupEspecialesEventListeners() {
            // Navigation button
            const especialesViewBtnMobile = document.getElementById('especialesViewBtnMobile');
            if (especialesViewBtnMobile) {
                especialesViewBtnMobile.addEventListener('click', () => {
                    showEspecialesView();
                    closeMobileMenu();
                });
            }
            
            // Search functionality
            const especialesSearchInput = document.getElementById('especialesSearchInput');
            if (especialesSearchInput) {
                especialesSearchInput.addEventListener('input', debounce(() => {
                    renderEspeciales(especialesSearchInput.value);
                }, 300));
            }
            
            // Add especial button
            const addEspecialBtn = document.getElementById('addEspecialBtn');
            const especialFormModal = document.getElementById('especialFormModal');
            const closeEspecialFormModal = document.getElementById('closeEspecialFormModal');
            const cancelEspecialBtn = document.getElementById('cancelEspecialBtn');
            const especialForm = document.getElementById('especialForm');
            
            if (addEspecialBtn) {
                addEspecialBtn.addEventListener('click', () => {
                    document.getElementById('especialFormTitle').textContent = 'Nuevo Especial';
                    document.getElementById('especialId').value = '';
                    document.getElementById('especialProvider').value = '';
                    document.getElementById('especialProduct').value = '';
                    document.getElementById('especialPrice').value = '';
                    especialFormModal.classList.remove('hidden');
                });
            }
            
            if (closeEspecialFormModal) {
                closeEspecialFormModal.addEventListener('click', () => {
                    especialFormModal.classList.add('hidden');
                });
            }
            
            if (cancelEspecialBtn) {
                cancelEspecialBtn.addEventListener('click', () => {
                    especialFormModal.classList.add('hidden');
                });
            }
            
            if (especialForm) {
                especialForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Disable submit button to prevent double submission
                    const submitBtn = e.target.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Guardando...';
                    
                    try {
                        const provider = document.getElementById('especialProvider').value.trim();
                        const product = document.getElementById('especialProduct').value.trim();
                        const price = document.getElementById('especialPrice').value;
                        
                        // Validate all required fields
                        if (!provider || !product || !price) {
                            showToast('Por favor completa todos los campos obligatorios', true);
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                            return;
                        }
                        
                        // Validate price is a valid positive number
                        const priceNum = parseFloat(price);
                        if (isNaN(priceNum) || priceNum < 0) {
                            showToast('Por favor ingresa un precio válido (mayor o igual a 0)', true);
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                            return;
                        }
                        
                        await addEspecial(provider, product, price);
                        especialFormModal.classList.add('hidden');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    } catch (error) {
                        console.error('Error saving especial:', error);
                        showToast('Error al guardar el especial. Por favor, intenta de nuevo.', true);
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            }
            
            // Close modal on outside click
            if (especialFormModal) {
                especialFormModal.addEventListener('click', (e) => {
                    if (e.target === especialFormModal) {
                        especialFormModal.classList.add('hidden');
                    }
                });
            }
        }

        // ==== CRÉDITOS FUNCTIONALITY ====
        let credits = [];
        let currentCreditView = 'pending';
        let creditNotificationInterval = null;

        // Load credits from Firebase with localStorage fallback
        function loadCredits() {
            try {
                if (database) {
                    database.ref('credits').on('value', (snapshot) => {
                        credits = snapshot.val() || [];
                        // Render current view if we're in credits section
                        if (currentView === 'creditos') {
                            if (currentCreditView === 'pending') {
                                renderPendingCredits();
                            } else if (currentCreditView === 'history') {
                                renderHistoryCredits();
                            }
                        }
                        console.log('Credits synchronized from Firebase.');
                    });
                } else {
                    throw new Error('Firebase not available');
                }
            } catch (err) {
                console.warn('Using localStorage for credits', err);
                if (isLocalStorageAvailable()) {
                    const stored = localStorage.getItem('credits');
                    credits = stored ? JSON.parse(stored) : [];
                }
            }
        }

        // Save credits to Firebase and localStorage
        function saveCredits() {
            return new Promise((resolve) => {
                try {
                    if (database) {
                        database.ref('credits').set(credits)
                            .then(() => {
                                console.log('Credits saved to Firebase successfully');
                                if (isLocalStorageAvailable()) {
                                    localStorage.setItem('credits', JSON.stringify(credits));
                                }
                                resolve();
                            })
                            .catch((err) => {
                                console.warn('Firebase save error for credits, using localStorage as fallback', err);
                                if (isLocalStorageAvailable()) {
                                    localStorage.setItem('credits', JSON.stringify(credits));
                                }
                                resolve(); // Resolve with localStorage fallback instead of rejecting
                            });
                    } else {
                        if (isLocalStorageAvailable()) {
                            localStorage.setItem('credits', JSON.stringify(credits));
                        }
                        resolve();
                    }
                } catch (err) {
                    console.error('Error saving credits:', err);
                    if (isLocalStorageAvailable()) {
                        localStorage.setItem('credits', JSON.stringify(credits));
                    }
                    resolve(); // Resolve to prevent UI from hanging on error
                }
            });
        }

        // Generate unique ID for credits
        function generateCreditId() {
            return 'CR-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9).toUpperCase();
        }

        // Calculate days elapsed
        function getDaysElapsed(dateStr) {
            const creditDate = new Date(dateStr);
            const now = new Date();
            const diff = now - creditDate;
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        // Get time elapsed text
        function getTimeElapsedText(days) {
            if (days === 0) return 'Hoy';
            if (days === 1) return 'Hace 1 día';
            if (days < 7) return `Hace ${days} días`;
            if (days < 14) return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? 's' : ''}`;
            return `Hace ${Math.floor(days / 7)} semanas`;
        }

        // Get urgency class
        function getUrgencyClass(days) {
            if (days < 7) return 'credit-ok';
            if (days < 14) return 'credit-warning';
            return 'credit-urgent';
        }

        // Convert image to base64
        function imageToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Show credits view
        function showCreditsView(subView) {
            currentView = 'creditos';
            currentCreditView = subView;
            
            // Hide all main sections
            adminView.classList.add('hidden');
            publicView.classList.add('hidden');
            document.getElementById('creditosView').classList.remove('hidden');
            
            // Hide all credit subsections
            document.getElementById('creditosPending').classList.add('hidden');
            document.getElementById('creditosRegister').classList.add('hidden');
            document.getElementById('creditosDeliver').classList.add('hidden');
            document.getElementById('creditosHistory').classList.add('hidden');
            
            // Show requested subsection
            if (subView === 'pending') {
                document.getElementById('creditosPending').classList.remove('hidden');
                renderPendingCredits();
            } else if (subView === 'register') {
                document.getElementById('creditosRegister').classList.remove('hidden');
                initializeProductFields();
            } else if (subView === 'deliver') {
                document.getElementById('creditosDeliver').classList.remove('hidden');
            } else if (subView === 'history') {
                document.getElementById('creditosHistory').classList.remove('hidden');
                renderHistoryCredits();
            }
            
            // Update header buttons
            updateHeaderButtons();
        }

        // Update header button styles (mobile menu only)
        function updateHeaderButtons() {
            const publicBtn = document.getElementById('publicViewBtnMobile');
            const especialesBtn = document.getElementById('especialesViewBtnMobile');
            const creditosBtn = document.getElementById('creditosViewBtnMobile');
            const adminBtn = document.getElementById('adminViewBtnMobile');
            
            if (!publicBtn || !especialesBtn || !creditosBtn || !adminBtn) return;
            
            publicBtn.classList.remove('bg-mexican-green', 'text-white');
            especialesBtn.classList.remove('bg-mexican-green', 'text-white');
            creditosBtn.classList.remove('bg-mexican-green', 'text-white');
            adminBtn.classList.remove('bg-mexican-green', 'text-white', 'bg-mexican-red');
            
            publicBtn.classList.add('bg-white', 'text-mexican-green');
            especialesBtn.classList.add('bg-white', 'text-mexican-green');
            creditosBtn.classList.add('bg-white', 'text-mexican-green');
            adminBtn.classList.add('bg-white', 'text-mexican-green');
            
            if (currentView === 'public') {
                publicBtn.classList.remove('bg-white', 'text-mexican-green');
                publicBtn.classList.add('bg-mexican-green', 'text-white');
            } else if (currentView === 'especiales') {
                especialesBtn.classList.remove('bg-white', 'text-mexican-green');
                especialesBtn.classList.add('bg-mexican-green', 'text-white');
            } else if (currentView === 'creditos') {
                creditosBtn.classList.remove('bg-white', 'text-mexican-green');
                creditosBtn.classList.add('bg-mexican-green', 'text-white');
            } else if (currentView === 'admin') {
                adminBtn.classList.remove('bg-white', 'text-mexican-green');
                adminBtn.classList.add('bg-mexican-red', 'text-white');
            }
        }

        // Initialize product fields
        function initializeProductFields() {
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '';
            addProductFieldToForm();
        }

        // Add product field to form
        function addProductFieldToForm() {
            const productsList = document.getElementById('productsList');
            const fieldIndex = productsList.children.length;
            
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'product-field p-4 mb-4 border-2 border-gray-200 rounded-lg';
            fieldDiv.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-semibold text-gray-700">Producto ${fieldIndex + 1}</h4>
                    ${fieldIndex > 0 ? `<button type="button" class="remove-product-field bg-mexican-red text-white px-3 py-1 rounded-lg text-sm hover:bg-opacity-90">Eliminar</button>` : ''}
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad*</label>
                        <input type="number" class="product-qty w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-mexican-green" required min="1" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Código UPC Completo* (12-13 dígitos)
                            <button type="button" class="scan-upc-btn ml-2 bg-mexican-green text-white px-3 py-1 rounded text-xs hover:bg-opacity-90" aria-label="Activar escáner de código de barras">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd" />
                                </svg>
                                Escanear
                            </button>
                        </label>
                        <input 
                            type="text" 
                            class="product-upc w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-mexican-green" 
                            required 
                            pattern="[0-9]{12,13}" 
                            placeholder="012345678901" 
                            maxlength="13"
                            autocomplete="off"
                            autocorrect="off"
                            inputmode="numeric"
                        />
                        <p class="text-xs text-gray-500 mt-1">Ingresa manualmente o escanea con pistola Zebra</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción / Nombre del Producto* (máx 100 caracteres)</label>
                        <input type="text" class="product-desc w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-mexican-green" required maxlength="100" placeholder="Se auto-llenará si el UPC existe en catálogo" />
                        <p class="text-xs text-gray-500 mt-1">Se completa automáticamente si el UPC se encuentra en el catálogo</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Foto (Opcional - JPG/PNG, máx 5MB)</label>
                        <input type="file" accept="image/jpeg,image/png" class="product-photo w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-mexican-green" />
                        <div class="product-photo-preview mt-2"></div>
                    </div>
                </div>
            `;
            
            productsList.appendChild(fieldDiv);
            
            // Setup UPC input handler with debouncing
            const upcInput = fieldDiv.querySelector('.product-upc');
            const descInput = fieldDiv.querySelector('.product-desc');
            
            // Almacenar el timer de debounce como propiedad del elemento para evitar conflictos entre múltiples campos
            upcInput.upcDebounceTimer = null;
            
            // Debounced UPC lookup para evitar búsquedas excesivas mientras se escribe
            upcInput.addEventListener('input', (e) => {
                clearTimeout(upcInput.upcDebounceTimer);
                upcInput.upcDebounceTimer = setTimeout(() => {
                    handleUPCInput(upcInput, descInput, fieldDiv);
                }, 500); // Esperar 500ms después de que el usuario deje de escribir
            });
            
            // También procesar cuando el usuario presiona Enter o pierde el foco
            upcInput.addEventListener('blur', () => {
                clearTimeout(upcInput.upcDebounceTimer);
                handleUPCInput(upcInput, descInput, fieldDiv);
            });
            
            upcInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(upcInput.upcDebounceTimer);
                    handleUPCInput(upcInput, descInput, fieldDiv);
                }
            });
            
            // Setup scan button to focus UPC field
            const scanBtn = fieldDiv.querySelector('.scan-upc-btn');
            scanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                upcInput.focus();
                showToast('Listo para escanear. Usa la pistola Zebra ahora.', false);
            });
            
            // Setup photo preview
            const photoInput = fieldDiv.querySelector('.product-photo');
            const previewDiv = fieldDiv.querySelector('.product-photo-preview');
            
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        showToast('La foto debe ser menor a 5MB', true);
                        e.target.value = '';
                        return;
                    }
                    const base64 = await imageToBase64(file);
                    previewDiv.innerHTML = `<img src="${base64}" class="photo-preview" alt="Vista previa" />`;
                }
            });
            
            // Setup remove button
            if (fieldIndex > 0) {
                const removeBtn = fieldDiv.querySelector('.remove-product-field');
                removeBtn.addEventListener('click', () => {
                    fieldDiv.remove();
                    updateProductNumbers();
                });
            }
        }

        // Update product numbers
        function updateProductNumbers() {
            const fields = document.querySelectorAll('.product-field');
            fields.forEach((field, index) => {
                field.querySelector('h4').textContent = `Producto ${index + 1}`;
            });
        }

        /**
         * Valida si un UPC tiene el formato correcto (12-13 dígitos numéricos)
         * @param {string} upc - El código UPC a validar
         * @returns {boolean} - True si el UPC es válido, false en caso contrario
         */
        function isValidUPC(upc) {
            // El UPC debe ser una cadena de 12 o 13 dígitos numéricos
            return /^\d{12,13}$/.test(upc);
        }

        /**
         * Busca un producto en el catálogo por su código UPC
         * @param {string} upc - El código UPC a buscar
         * @returns {object|null} - El producto encontrado o null si no existe
         */
        function buscarProductoPorUPC(upc) {
            // Normalizar el UPC (eliminar espacios y convertir a string)
            const upcNormalizado = String(upc).trim();
            
            // Buscar en el catálogo
            const productoEncontrado = catalogo.find(p => p.upc === upcNormalizado);
            
            if (productoEncontrado) {
                console.log('Producto encontrado en catálogo:', productoEncontrado);
            } else {
                console.log('Producto no encontrado para UPC:', upcNormalizado);
            }
            
            return productoEncontrado || null;
        }

        /**
         * Maneja el evento de entrada de UPC en el campo de texto
         * Busca el producto y auto-llena los campos si se encuentra
         * @param {HTMLInputElement} upcInput - El campo de entrada de UPC
         * @param {HTMLInputElement} descInput - El campo de descripción
         * @param {HTMLElement} fieldDiv - El contenedor del campo de producto
         */
        function handleUPCInput(upcInput, descInput, fieldDiv) {
            const upcValue = upcInput.value.trim();
            
            // Restablecer estilos si el campo está vacío
            if (!upcValue) {
                upcInput.style.border = '';
                descInput.readOnly = false;
                descInput.value = '';
                descInput.style.backgroundColor = '';
                descInput.style.cursor = '';
                return;
            }
            
            // Validar formato de UPC
            if (isValidUPC(upcValue)) {
                // Buscar producto en el catálogo
                const producto = buscarProductoPorUPC(upcValue);
                
                if (producto) {
                    // Producto encontrado - Aplicar borde verde y auto-llenar
                    upcInput.style.border = '2px solid #10b981'; // Verde Tailwind green-500
                    descInput.value = producto.nombre;
                    descInput.readOnly = true; // Hacer solo lectura cuando se auto-llena (permite copiar pero no editar)
                    descInput.style.backgroundColor = '#f0fdf4'; // Verde claro Tailwind green-50
                    descInput.style.cursor = 'not-allowed'; // Indicador visual de que no se puede editar
                    showToast(`Producto encontrado: ${producto.nombre}`, false);
                } else {
                    // UPC válido pero producto no encontrado
                    upcInput.style.border = '2px solid #f97316'; // Naranja Tailwind orange-500
                    descInput.value = '';
                    descInput.readOnly = false; // Habilitar entrada manual
                    descInput.style.backgroundColor = '';
                    descInput.style.cursor = '';
                    showToast('UPC no encontrado en el catálogo. Por favor, ingresa el nombre del producto manualmente.', true);
                    // Enfocar el campo de descripción para entrada manual
                    descInput.focus();
                }
            } else {
                // UPC inválido (no cumple con 12-13 dígitos)
                upcInput.style.border = '2px solid #ef4444'; // Rojo Tailwind red-500
                descInput.readOnly = false;
                descInput.value = '';
                descInput.style.backgroundColor = '';
                descInput.style.cursor = '';
            }
        }

        // Render pending credits
        function renderPendingCredits(searchTerm = '', filter = 'all') {
            const container = document.getElementById('pendingCreditsContainer');
            container.innerHTML = '';
            
            let filtered = credits.filter(c => c.status === 'pending');
            
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(c => 
                    (c.provider || '').toLowerCase().includes(term) ||
                    c.products.some(p => 
                        p.desc.toLowerCase().includes(term) || 
                        (p.upc || '').includes(term) ||
                        (p.digits || '').includes(term)
                    ) ||
                    (c.notes || '').toLowerCase().includes(term)
                );
            }
            
            // Apply time filter
            if (filter !== 'all') {
                filtered = filtered.filter(c => {
                    const days = getDaysElapsed(c.date);
                    if (filter === 'week1') return days < 7;
                    if (filter === 'week2') return days >= 7 && days < 14;
                    if (filter === 'week3') return days >= 14;
                    return true;
                });
            }
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">No hay créditos pendientes</h3>
                        <p class="mt-1 text-gray-500">Registra un nuevo crédito para comenzar.</p>
                    </div>
                `;
                return;
            }
            
            filtered.forEach(credit => {
                const days = getDaysElapsed(credit.date);
                const urgencyClass = getUrgencyClass(days);
                const timeText = getTimeElapsedText(days);
                const totalProducts = credit.products.reduce((sum, p) => sum + parseInt(p.qty, 10), 0);
                const firstPhoto = credit.products[0]?.photo;
                
                // Build products list HTML
                const productsListHTML = credit.products.map(p => `
                    <li class="text-sm bg-gray-50 p-2 rounded">
                        <strong>${p.qty}x</strong> ${sanitizeInput(p.desc)}
                        <br/><span class="text-gray-600">UPC: ${sanitizeInput(p.upc || p.digits || 'N/A')}</span>
                        ${p.photo ? `<br/><img src="${p.photo}" class="photo-thumbnail mt-1 view-photo-modal" alt="Producto" data-photo="${p.photo}" />` : ''}
                    </li>
                `).join('');
                
                const card = document.createElement('div');
                card.className = `bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 card-hover ${urgencyClass}`;
                card.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-grow">
                                <p class="text-sm text-gray-500">ID: ${credit.id}</p>
                                <h3 class="text-lg font-bold text-gray-900">${sanitizeInput(credit.provider || 'Sin proveedor')}</h3>
                            </div>
                            <span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">Pendiente</span>
                        </div>
                        
                        <div class="space-y-2 mb-4">
                            <p class="text-sm"><strong>Total Productos:</strong> ${totalProducts}</p>
                            <p class="text-sm"><strong>Fecha:</strong> ${new Date(credit.date).toLocaleDateString('es-MX')}</p>
                            <p class="text-sm"><strong>Tiempo:</strong> ${timeText}</p>
                        </div>
                        
                        <div class="mb-4">
                            <p class="text-sm font-semibold mb-2">Productos:</p>
                            <ul class="space-y-2">
                                ${productsListHTML}
                            </ul>
                        </div>
                        
                        ${credit.notes ? `
                            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p class="text-sm"><strong>Notas:</strong> ${sanitizeInput(credit.notes)}</p>
                            </div>
                        ` : ''}
                        
                        <button class="mark-delivered w-full bg-mexican-green hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all" data-credit-id="${credit.id}">
                            Marcar como Entregado
                        </button>
                    </div>
                `;
                
                container.appendChild(card);
            });
            
            // Setup event listeners for mark delivered buttons
            container.querySelectorAll('.mark-delivered').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const creditId = e.target.dataset.creditId;
                    const credit = credits.find(c => c.id === creditId);
                    if (!credit) return;
                    
                    // Show confirmation dialog
                    const totalProducts = credit.products.reduce((sum, p) => sum + parseInt(p.qty, 10), 0);
                    const confirmMsg = `¿Deseas marcar como entregado el crédito?\n\nID: ${credit.id}\nProveedor: ${credit.provider || 'Sin proveedor'}\nTotal Productos: ${totalProducts}\n\nPresiona "Aceptar" para continuar o "Cancelar" para volver.`;
                    
                    if (confirm(confirmMsg)) {
                        showDeliverForm(creditId);
                    }
                });
            });
            
            // Setup event listeners for photo thumbnails
            container.querySelectorAll('.view-photo-modal').forEach(img => {
                img.addEventListener('click', (e) => {
                    showPhotoModal(e.target.dataset.photo);
                });
            });
        }

        // Show deliver form
        function showDeliverForm(creditId) {
            const credit = credits.find(c => c.id === creditId);
            if (!credit) return;
            
            document.getElementById('deliverCreditId').value = creditId;
            document.getElementById('deliveryDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('deliveryNotes').value = '';
            document.getElementById('deliveryPhoto').value = '';
            document.getElementById('deliveryPhotoPreview').innerHTML = '';
            
            // Show credit summary with all details
            const totalProducts = credit.products.reduce((sum, p) => sum + parseInt(p.qty, 10), 0);
            
            // Build products list HTML with all details
            const productsListHTML = credit.products.map(p => `
                <li class="bg-gray-50 p-3 rounded mb-2">
                    <div class="text-sm">
                        <strong>${p.qty}x</strong> ${sanitizeInput(p.desc)}
                        <br/><span class="text-gray-600">UPC: ${sanitizeInput(p.upc || p.digits || 'N/A')}</span>
                    </div>
                    ${p.photo ? `
                        <div class="mt-2">
                            <img src="${p.photo}" class="photo-thumbnail view-photo-modal" alt="Producto" data-photo="${p.photo}" />
                        </div>
                    ` : ''}
                </li>
            `).join('');
            
            const summaryDiv = document.getElementById('creditSummary');
            summaryDiv.innerHTML = `
                <h3 class="text-lg font-bold mb-4">Resumen del Crédito</h3>
                <div class="space-y-4">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <p class="mb-2"><strong>ID:</strong> ${credit.id}</p>
                            <p class="mb-2"><strong>Proveedor:</strong> ${sanitizeInput(credit.provider || 'Sin proveedor')}</p>
                            <p class="mb-2"><strong>Fecha Registro:</strong> ${new Date(credit.date).toLocaleDateString('es-MX')}</p>
                            <p class="mb-2"><strong>Total Productos:</strong> ${totalProducts}</p>
                        </div>
                    </div>
                    
                    ${credit.notes ? `
                        <div class="p-3 bg-blue-50 rounded-lg">
                            <p class="text-sm"><strong>Notas del Crédito:</strong> ${sanitizeInput(credit.notes)}</p>
                        </div>
                    ` : ''}
                    
                    <div>
                        <p class="font-semibold mb-2">Productos:</p>
                        <ul class="space-y-2">
                            ${productsListHTML}
                        </ul>
                    </div>
                </div>
            `;
            
            // Setup photo modal for summary
            summaryDiv.querySelectorAll('.view-photo-modal').forEach(img => {
                img.addEventListener('click', (e) => {
                    showPhotoModal(e.target.dataset.photo);
                });
            });
            
            showCreditsView('deliver');
        }

        // Render history credits
        function renderHistoryCredits(searchTerm = '') {
            const container = document.getElementById('historyCreditsContainer');
            container.innerHTML = '';
            
            let filtered = credits.filter(c => c.status === 'delivered');
            
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(c => 
                    (c.provider || '').toLowerCase().includes(term) ||
                    c.products.some(p => 
                        p.desc.toLowerCase().includes(term) || 
                        (p.upc || '').includes(term) ||
                        (p.digits || '').includes(term)
                    )
                );
            }
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">No hay entregas registradas</h3>
                    </div>
                `;
                return;
            }
            
            filtered.forEach(credit => {
                // Build products list HTML with photos
                const productsListHTML = credit.products.map(p => `
                    <li class="text-sm bg-gray-50 p-2 rounded">
                        <strong>${p.qty}x</strong> ${sanitizeInput(p.desc)}
                        <br/><span class="text-gray-600">UPC: ${sanitizeInput(p.upc || p.digits || 'N/A')}</span>
                        ${p.photo ? `<br/><img src="${p.photo}" class="photo-thumbnail mt-1 view-photo-modal" alt="Producto" data-photo="${p.photo}" />` : ''}
                    </li>
                `).join('');
                
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 card-hover';
                card.innerHTML = `
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-grow">
                                <p class="text-sm text-gray-500">ID: ${credit.id}</p>
                                <h3 class="text-lg font-bold text-gray-900">${sanitizeInput(credit.provider || 'Sin proveedor')}</h3>
                            </div>
                            <span class="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">Entregado</span>
                        </div>
                        
                        <div class="space-y-2 mb-4">
                            <p class="text-sm"><strong>Fecha Registro:</strong> ${new Date(credit.date).toLocaleDateString('es-MX')}</p>
                            <p class="text-sm"><strong>Fecha Entrega:</strong> ${new Date(credit.deliveryDate).toLocaleDateString('es-MX')}</p>
                        </div>
                        
                        ${credit.notes ? `
                            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p class="text-sm"><strong>Notas del Crédito:</strong> ${sanitizeInput(credit.notes)}</p>
                            </div>
                        ` : ''}
                        
                        ${credit.deliveryNotes ? `
                            <div class="mb-4 p-3 bg-green-50 rounded-lg">
                                <p class="text-sm"><strong>Notas de Entrega:</strong> ${sanitizeInput(credit.deliveryNotes)}</p>
                            </div>
                        ` : ''}
                        
                        <div class="mb-4">
                            <p class="text-sm font-semibold mb-2">Productos:</p>
                            <ul class="space-y-2">
                                ${productsListHTML}
                            </ul>
                        </div>
                        
                        ${credit.deliveryPhoto ? `
                            <div class="mt-4">
                                <p class="text-sm font-semibold mb-2">Foto de entrega:</p>
                                <img src="${credit.deliveryPhoto}" class="photo-thumbnail mx-auto view-photo-modal" alt="Entrega" data-photo="${credit.deliveryPhoto}" />
                            </div>
                        ` : ''}
                    </div>
                `;
                
                container.appendChild(card);
            });
            
            // Setup event listeners for photo thumbnails
            container.querySelectorAll('.view-photo-modal').forEach(img => {
                img.addEventListener('click', (e) => {
                    showPhotoModal(e.target.dataset.photo);
                });
            });
        }

        // Show photo modal
        function showPhotoModal(photoUrl) {
            const modal = document.getElementById('photoModal');
            const img = document.getElementById('photoModalImage');
            img.src = photoUrl;
            modal.classList.remove('hidden');
        }

        // Check for overdue credits
        function checkOverdueCredits() {
            const overdue = credits.filter(c => {
                if (c.status !== 'pending') return false;
                const days = getDaysElapsed(c.date);
                return days > 7;
            });
            
            if (overdue.length > 0) {
                alert(`⚠️ Tienes ${overdue.length} crédito${overdue.length > 1 ? 's' : ''} con más de 7 días pendiente${overdue.length > 1 ? 's' : ''}.`);
            }
        }

        // Start notification interval
        function startCreditNotifications() {
            if (creditNotificationInterval) {
                clearInterval(creditNotificationInterval);
            }
            // Check every minute (60000 ms)
            creditNotificationInterval = setInterval(checkOverdueCredits, 60000);
        }

        // Stop notification interval
        function stopCreditNotifications() {
            if (creditNotificationInterval) {
                clearInterval(creditNotificationInterval);
                creditNotificationInterval = null;
            }
        }

        // Export history to CSV
        function exportHistoryToCSV() {
            const delivered = credits.filter(c => c.status === 'delivered');
            
            if (delivered.length === 0) {
                showToast('No hay entregas para exportar', true);
                return;
            }
            
            let csv = 'ID,Proveedor,Fecha Registro,Fecha Entrega,Productos,Notas Entrega\n';
            
            delivered.forEach(credit => {
                const products = credit.products.map(p => `${p.qty}x ${p.desc} (UPC: ${p.upc || p.digits || 'N/A'})`).join('; ');
                csv += `"${credit.id}","${credit.provider || ''}","${credit.date}","${credit.deliveryDate}","${products}","${credit.deliveryNotes || ''}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `historial-creditos-${Date.now()}.csv`;
            link.click();
            
            showToast('Historial exportado correctamente');
        }

        // Setup credits event listeners
        function setupCreditsEventListeners() {
            // Navigation buttons
            const creditosViewBtnMobile = document.getElementById('creditosViewBtnMobile');
            const newCreditBtn = document.getElementById('newCreditBtn');
            const cancelNewCredit = document.getElementById('cancelNewCredit');
            const cancelDelivery = document.getElementById('cancelDelivery');
            const backToPendingBtn = document.getElementById('backToPendingBtn');
            const exportHistoryBtn = document.getElementById('exportHistoryBtn');
            
            if (creditosViewBtnMobile) {
                creditosViewBtnMobile.addEventListener('click', () => {
                    showCreditsView('pending');
                    closeMobileMenu();
                });
            }
            
            if (newCreditBtn) {
                newCreditBtn.addEventListener('click', () => {
                    showCreditsView('register');
                });
            }
            
            if (cancelNewCredit) {
                cancelNewCredit.addEventListener('click', () => {
                    showCreditsView('pending');
                });
            }
            
            if (cancelDelivery) {
                cancelDelivery.addEventListener('click', () => {
                    showCreditsView('pending');
                });
            }
            
            if (backToPendingBtn) {
                backToPendingBtn.addEventListener('click', () => {
                    showCreditsView('pending');
                });
            }
            
            if (exportHistoryBtn) {
                exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
            }
            
            // Add product field button
            const addProductFieldBtn = document.getElementById('addProductField');
            if (addProductFieldBtn) {
                addProductFieldBtn.addEventListener('click', addProductFieldToForm);
            }
            
            // New credit form
            const newCreditForm = document.getElementById('newCreditForm');
            if (newCreditForm) {
                newCreditForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Disable submit button to prevent double submission
                    const submitBtn = e.target.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Guardando...';
                    
                    try {
                        const provider = document.getElementById('creditProvider').value.trim();
                        const date = document.getElementById('creditDate').value;
                        const notes = document.getElementById('creditNotes').value.trim();
                        
                        // Collect products
                        const productFields = document.querySelectorAll('.product-field');
                        const products = [];
                        
                        for (const field of productFields) {
                            const qty = field.querySelector('.product-qty').value;
                            const desc = field.querySelector('.product-desc').value.trim();
                            const upcInput = field.querySelector('.product-upc');
                            const upc = upcInput.value.trim();
                            const photoInput = field.querySelector('.product-photo');
                            
                            // Validar que todos los campos requeridos estén completos
                            if (!qty || !desc || !upc) {
                                showToast('Completa todos los campos obligatorios del producto', true);
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalText;
                                return;
                            }
                            
                            // Validar formato de UPC
                            if (!isValidUPC(upc)) {
                                showToast('El UPC debe contener 12 o 13 dígitos numéricos', true);
                                upcInput.focus();
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalText;
                                return;
                            }
                            
                            let photo = null;
                            if (photoInput.files[0]) {
                                photo = await imageToBase64(photoInput.files[0]);
                            }
                            
                            // Guardar producto con UPC completo y últimos 4 dígitos para compatibilidad
                            products.push({
                                qty: parseInt(qty),
                                desc,
                                upc: upc, // UPC completo
                                digits: upc.slice(-4), // Últimos 4 dígitos para compatibilidad con vistas existentes
                                photo
                            });
                        }
                        
                        const newCredit = {
                            id: generateCreditId(),
                            provider,
                            products,
                            date,
                            notes,
                            status: 'pending'
                        };
                        
                        credits.push(newCredit);
                        
                        // Wait for save to complete before showing success
                        await saveCredits();
                        
                        showToast('Crédito registrado correctamente');
                        
                        // Add visual transition before showing credits view
                        setTimeout(() => {
                            showCreditsView('pending');
                        }, 500);
                    } catch (error) {
                        console.error('Error saving credit:', error);
                        showToast('Error al guardar el crédito. Por favor, intenta de nuevo.', true);
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            }
            
            // Deliver credit form
            const deliverCreditForm = document.getElementById('deliverCreditForm');
            if (deliverCreditForm) {
                deliverCreditForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Disable submit button to prevent double submission
                    const submitBtn = e.target.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Guardando...';
                    
                    try {
                        const creditId = document.getElementById('deliverCreditId').value;
                        const deliveryDate = document.getElementById('deliveryDate').value;
                        const deliveryNotes = document.getElementById('deliveryNotes').value.trim();
                        const deliveryPhotoInput = document.getElementById('deliveryPhoto');
                        
                        const credit = credits.find(c => c.id === creditId);
                        if (!credit) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                            return;
                        }
                        
                        credit.status = 'delivered';
                        credit.deliveryDate = deliveryDate;
                        credit.deliveryNotes = deliveryNotes;
                        
                        if (deliveryPhotoInput.files[0]) {
                            credit.deliveryPhoto = await imageToBase64(deliveryPhotoInput.files[0]);
                        }
                        
                        // Wait for save to complete before showing success
                        await saveCredits();
                        
                        showToast('Crédito marcado como entregado');
                        
                        // Add visual transition before showing credits view
                        setTimeout(() => {
                            showCreditsView('pending');
                        }, 500);
                    } catch (error) {
                        console.error('Error saving delivery:', error);
                        showToast('Error al marcar como entregado. Por favor, intenta de nuevo.', true);
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            }
            
            // Credit date input - set default to today
            const creditDateInput = document.getElementById('creditDate');
            if (creditDateInput) {
                creditDateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Search and filter
            const creditSearchInput = document.getElementById('creditSearchInput');
            const creditFilterSelect = document.getElementById('creditFilterSelect');
            const historySearchInput = document.getElementById('historySearchInput');
            
            if (creditSearchInput) {
                creditSearchInput.addEventListener('input', debounce(() => {
                    renderPendingCredits(creditSearchInput.value, creditFilterSelect?.value || 'all');
                }, 300));
            }
            
            if (creditFilterSelect) {
                creditFilterSelect.addEventListener('change', () => {
                    renderPendingCredits(creditSearchInput?.value || '', creditFilterSelect.value);
                });
            }
            
            if (historySearchInput) {
                historySearchInput.addEventListener('input', debounce(() => {
                    renderHistoryCredits(historySearchInput.value);
                }, 300));
            }
            
            // Character counters
            const creditNotesInput = document.getElementById('creditNotes');
            const deliveryNotesInput = document.getElementById('deliveryNotes');
            
            if (creditNotesInput) {
                creditNotesInput.addEventListener('input', (e) => {
                    document.getElementById('creditNotesCount').textContent = e.target.value.length;
                });
            }
            
            if (deliveryNotesInput) {
                deliveryNotesInput.addEventListener('input', (e) => {
                    document.getElementById('deliveryNotesCount').textContent = e.target.value.length;
                });
            }
            
            // Delivery photo preview
            const deliveryPhotoInput = document.getElementById('deliveryPhoto');
            if (deliveryPhotoInput) {
                deliveryPhotoInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    const previewDiv = document.getElementById('deliveryPhotoPreview');
                    
                    if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                            showToast('La foto debe ser menor a 5MB', true);
                            e.target.value = '';
                            previewDiv.innerHTML = '';
                            return;
                        }
                        const base64 = await imageToBase64(file);
                        previewDiv.innerHTML = `<img src="${base64}" class="photo-preview" alt="Vista previa" />`;
                    } else {
                        previewDiv.innerHTML = '';
                    }
                });
            }
            
            // Photo modal
            const closePhotoModal = document.getElementById('closePhotoModal');
            const photoModal = document.getElementById('photoModal');
            
            if (closePhotoModal) {
                closePhotoModal.addEventListener('click', () => {
                    photoModal.classList.add('hidden');
                });
            }
            
            if (photoModal) {
                photoModal.addEventListener('click', (e) => {
                    if (e.target === photoModal) {
                        photoModal.classList.add('hidden');
                    }
                });
            }
            
            // Mobile menu
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                    mobileMenu.classList.toggle('mobile-menu-open');
                });
            }
            
            // Update public view button click handlers
            const publicViewBtnMobile = document.getElementById('publicViewBtnMobile');
            if (publicViewBtnMobile) {
                publicViewBtnMobile.addEventListener('click', () => {
                    showView('public');
                    closeMobileMenu();
                });
            }
            
            // Update admin view button click handlers
            const adminViewBtnMobile = document.getElementById('adminViewBtnMobile');
            if (adminViewBtnMobile) {
                adminViewBtnMobile.addEventListener('click', () => {
                    passwordModal.classList.remove('hidden');
                    adminPasswordInput.focus();
                    closeMobileMenu();
                });
            }
        }

        // Close mobile menu
        function closeMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('mobile-menu-open');
            }
        }

        // ============================================
        // AUTO-FOCUS FOR ZEBRA MC330M SCANNER
        // Automatically focuses the first UPC input field when
        // the credit registration form is displayed
        // ============================================
        
        /**
         * Sets focus on the first UPC input field in the credit registration form
         * This ensures the Zebra scanner can immediately scan barcodes
         */
        function focusFirstUPCInput() {
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                const firstUPCInput = document.querySelector('.product-upc');
                if (firstUPCInput) {
                    firstUPCInput.focus();
                    console.log('Auto-focused first UPC input for Zebra scanner');
                }
            }, 100);
        }
        
        // Override the showCreditsView function to add auto-focus
        const originalShowCreditsView = showCreditsView;
        showCreditsView = function(subView) {
            originalShowCreditsView(subView);
            
            // Auto-focus UPC input when showing register view
            if (subView === 'register') {
                focusFirstUPCInput();
            }
        };
        
        // ============================================
        // INITIALIZATION
        // ============================================
        
        // ==== Init ====
        function init(){ 
            loadData(); 
            loadEspeciales();
            loadCredits();
            setupEventListeners(); 
            setupEspecialesEventListeners();
            setupCreditsEventListeners();
            checkLibraries(); 
            showView('public');
            startCreditNotifications();
            
            // Initialize fullscreen mode for Zebra MC330M
            initFullscreenMode();
            
            console.log('Mexiquense catalog initialized with Zebra MC330M optimizations');
        }
        document.addEventListener('DOMContentLoaded', init);
