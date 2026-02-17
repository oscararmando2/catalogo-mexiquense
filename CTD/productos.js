// ============================================
// CTD - CATÁLOGO DE PRODUCTOS
// Product catalog with search and pagination
// ============================================

// Firebase configuration - using same config as main catalog
let database = null;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;

// Initialize Firebase
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
        console.log('Firebase initialized for CTD Products');
    } else {
        console.error('Firebase not loaded');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// DOM Elements
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const productsGrid = document.getElementById('productsGrid');
const productsCount = document.getElementById('productsCount');
const countCurrent = document.getElementById('countCurrent');
const countTotal = document.getElementById('countTotal');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const paginationContainer = document.getElementById('paginationContainer');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const uploadForm = document.getElementById('uploadForm');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Format currency in Mexican pesos
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

/**
 * Calculate margin as percentage of base price
 * @param {number} margin - The profit margin amount
 * @param {number} basePrice - The base price for calculation
 * @return {number} The percentage value
 */
function calculatePercentage(margin, basePrice) {
    if (basePrice === null || basePrice === undefined || basePrice === 0) return 0;
    return (margin / basePrice) * 100;
}

/**
 * Calculate margins for a product
 */
function calculateMargins(product) {
    const {
        precio_cortes_tienda = 0,
        precio_cortes_ctd = 0,
        precio_ctd_tienda = 0,
        precio_venta_cliente = 0
    } = product;

    // Margen Tienda Directo = precio_venta_cliente - precio_cortes_tienda
    const margenTiendaDirecto = precio_venta_cliente - precio_cortes_tienda;
    
    // Margen CTD = precio_ctd_tienda - precio_cortes_ctd
    const margenCTD = precio_ctd_tienda - precio_cortes_ctd;
    const margenCTDPercent = calculatePercentage(margenCTD, precio_cortes_ctd);
    
    // Margen Tienda vía CTD = precio_venta_cliente - precio_ctd_tienda
    const margenTiendaViaCTD = precio_venta_cliente - precio_ctd_tienda;
    const margenTiendaViaCTDPercent = calculatePercentage(margenTiendaViaCTD, precio_ctd_tienda);
    
    // Margen Grupo = Margen CTD + Margen Tienda vía CTD
    const margenGrupo = margenCTD + margenTiendaViaCTD;

    return {
        margenTiendaDirecto,
        margenCTD,
        margenCTDPercent,
        margenTiendaViaCTD,
        margenTiendaViaCTDPercent,
        margenGrupo
    };
}

/**
 * Get color class based on margin value
 */
function getMarginColorClass(margin) {
    if (margin > 10) return 'bg-green-100 text-green-800 border-green-300';
    if (margin > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
}

/**
 * Get badge color for margin grupo
 */
function getMarginBadgeColor(margin) {
    if (margin > 10) return 'bg-green-500';
    if (margin > 0) return 'bg-yellow-500';
    return 'bg-red-500';
}

// ============================================
// SEARCH & FILTER FUNCTIONS
// ============================================

/**
 * Filter products based on search query
 */
function filterProducts(query) {
    if (!query || query.trim() === '') {
        filteredProducts = [...allProducts];
    } else {
        const lowerQuery = query.toLowerCase().trim();
        filteredProducts = allProducts.filter(({ product }) => {
            const description = (product.description || '').toLowerCase();
            const barcode = (product.barcode || '').toLowerCase();
            return description.includes(lowerQuery) || barcode.includes(lowerQuery);
        });
    }
    currentPage = 1;
    renderProducts();
}

/**
 * Clear search and reset filters
 */
function clearSearchAndFilters() {
    searchInput.value = '';
    filterProducts('');
}

// ============================================
// PAGINATION FUNCTIONS
// ============================================

/**
 * Get products for current page
 */
function getPaginatedProducts() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
}

/**
 * Get total pages
 */
function getTotalPages() {
    return Math.ceil(filteredProducts.length / productsPerPage);
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const totalPages = getTotalPages();
    
    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        return;
    }
    
    paginationContainer.classList.remove('hidden');
    
    // Update prev/next buttons
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
    
    // Render page numbers
    pageNumbers.innerHTML = '';
    
    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = `px-4 py-2 rounded-lg ${
            i === currentPage 
                ? 'bg-mexican-green text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-50'
        }`;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        pageNumbers.appendChild(pageBtn);
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Go to previous page
 */
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render a single product card
 */
function renderProductCard(product, productId) {
    const margins = calculateMargins(product);
    const margenGrupoColor = getMarginColorClass(margins.margenGrupo);
    const badgeColor = getMarginBadgeColor(margins.margenGrupo);

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 card-hover';
    
    card.innerHTML = `
        <div class="product-image-container relative">
            <img src="${product.image_url || 'https://placehold.co/300x300/png?text=Sin+Imagen'}" 
                 alt="${sanitizeInput(product.description)}" 
                 class="product-image"
                 onerror="this.onerror=null; this.src='https://placehold.co/300x300/png?text=Error';">
            <div class="absolute top-2 right-2 ${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Margen: ${formatCurrency(margins.margenGrupo)}
            </div>
        </div>
        
        <div class="p-5">
            <!-- Product Info -->
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">${sanitizeInput(product.description)}</h3>
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Código:</span> ${sanitizeInput(product.barcode)}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    ${sanitizeInput(product.proveedor_origen)} → ${sanitizeInput(product.tienda)}
                </p>
            </div>

            <!-- Price Flow -->
            <div class="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600">Cortes → Tienda:</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(product.precio_cortes_tienda)}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600">Cortes → CTD:</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(product.precio_cortes_ctd)}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600">CTD → Tienda:</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(product.precio_ctd_tienda)}</span>
                </div>
                <div class="flex justify-between items-center text-sm border-t border-gray-200 pt-2">
                    <span class="text-gray-700 font-medium">Venta Cliente:</span>
                    <span class="font-bold text-mexican-green">${formatCurrency(product.precio_venta_cliente)}</span>
                </div>
            </div>

            <!-- Margins Summary -->
            <div class="space-y-2">
                <div class="flex justify-between items-center text-sm flex-nowrap">
                    <span class="text-gray-600 whitespace-nowrap">Margen CTD:</span>
                    <span class="font-semibold whitespace-nowrap ${margins.margenCTD > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(margins.margenCTD)} (${margins.margenCTDPercent.toFixed(2)}%)
                    </span>
                </div>
                <div class="flex justify-between items-center text-sm flex-nowrap">
                    <span class="text-gray-600 whitespace-nowrap">Margen Tienda (vía CTD):</span>
                    <span class="font-semibold whitespace-nowrap ${margins.margenTiendaViaCTD > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(margins.margenTiendaViaCTD)} (${margins.margenTiendaViaCTDPercent.toFixed(2)}%)
                    </span>
                </div>
                <div class="${margenGrupoColor} rounded-lg p-3 border-2 mt-3">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-sm">MARGEN GRUPO:</span>
                        <span class="font-bold text-lg">${formatCurrency(margins.margenGrupo)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

/**
 * Update products count display
 */
function updateProductsCount() {
    const paginatedProducts = getPaginatedProducts();
    const startIndex = (currentPage - 1) * productsPerPage + 1;
    const endIndex = startIndex + paginatedProducts.length - 1;
    
    if (filteredProducts.length > 0) {
        productsCount.classList.remove('hidden');
        countCurrent.textContent = `${startIndex}-${endIndex}`;
        countTotal.textContent = filteredProducts.length;
    } else {
        productsCount.classList.add('hidden');
    }
}

/**
 * Render all products for current page
 */
function renderProducts() {
    productsGrid.innerHTML = '';
    
    if (allProducts.length === 0) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        productsCount.classList.add('hidden');
        paginationContainer.classList.add('hidden');
        return;
    }
    
    if (filteredProducts.length === 0) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h3').textContent = 'No se encontraron productos';
        emptyState.querySelector('p').textContent = 'Intenta con otra búsqueda.';
        productsCount.classList.add('hidden');
        paginationContainer.classList.add('hidden');
        return;
    }

    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    const paginatedProducts = getPaginatedProducts();
    
    paginatedProducts.forEach(({ product, id }) => {
        const card = renderProductCard(product, id);
        productsGrid.appendChild(card);
    });
    
    updateProductsCount();
    renderPagination();
}

// ============================================
// FIREBASE FUNCTIONS
// ============================================

/**
 * Load products from Firebase
 */
function loadProducts() {
    if (!database) {
        console.error('Database not initialized');
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    const productsRef = database.ref('CTD/products');
    
    productsRef.on('value', (snapshot) => {
        allProducts = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allProducts.push({
                    id: key,
                    product: data[key]
                });
            });
        }
        
        console.log(`Loaded ${allProducts.length} products from CTD/products`);
        filteredProducts = [...allProducts];
        renderProducts();
    }, (error) => {
        console.error('Error loading products:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    });
}

/**
 * Save product to Firebase
 */
function saveProduct(productData) {
    if (!database) {
        alert('Error: Base de datos no inicializada');
        return;
    }

    const productsRef = database.ref('CTD/products');
    const newProductRef = productsRef.push();
    
    newProductRef.set(productData)
        .then(() => {
            console.log('Product saved successfully');
            alert('Producto guardado exitosamente');
            closeUploadModal();
            uploadForm.reset();
        })
        .catch((error) => {
            console.error('Error saving product:', error);
            alert('Error al guardar el producto: ' + error.message);
        });
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openUploadModal() {
    uploadModal.classList.remove('hidden');
}

function closeUploadModal() {
    uploadModal.classList.add('hidden');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Search functionality
searchInput.addEventListener('input', (e) => {
    filterProducts(e.target.value);
});

clearSearch.addEventListener('click', clearSearchAndFilters);

// Pagination
prevPage.addEventListener('click', goToPrevPage);
nextPage.addEventListener('click', goToNextPage);

// Modal
uploadBtn.addEventListener('click', openUploadModal);
closeModal.addEventListener('click', closeUploadModal);
cancelBtn.addEventListener('click', closeUploadModal);

// Close modal on outside click
uploadModal.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        closeUploadModal();
    }
});

// Handle form submission
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const productData = {
        description: document.getElementById('description').value.trim(),
        barcode: document.getElementById('barcode').value.trim(),
        image_url: document.getElementById('imageUrl').value.trim(),
        proveedor_origen: document.getElementById('proveedorOrigen').value,
        tienda: document.getElementById('tienda').value,
        precio_cortes_tienda: parseFloat(document.getElementById('precioCortesToreTienda').value),
        precio_cortes_ctd: parseFloat(document.getElementById('precioCortesCTD').value),
        precio_ctd_tienda: parseFloat(document.getElementById('precioCTDTienda').value),
        precio_venta_cliente: parseFloat(document.getElementById('precioVentaCliente').value)
    };
    
    saveProduct(productData);
});

// ============================================
// INITIALIZATION
// ============================================

// Load products on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('CTD Products Catalog initialized');
    loadProducts();
});
