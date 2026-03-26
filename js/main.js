let products = [];
let originalProducts = []; 
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Biến cho thanh toán
let discountAmount = 0;
let appliedVoucher = "";

// --- TOAST THÔNG BÁO ---
function showToast(message, type = 'success') {
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-warning');
    const toastHTML = `
        <div class="toast align-items-center text-white ${bgClass} border-0 show" role="alert">
            <div class="d-flex">
                <div class="toast-body fw-bold">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
    const container = document.getElementById('toastContainer');
    container.insertAdjacentHTML('beforeend', toastHTML);
    const newToast = container.lastElementChild;
    setTimeout(() => { if(newToast) newToast.remove(); }, 3000);
}

// --- KHỞI TẠO API SẢN PHẨM ---
async function fetchCategories() {
    try {
        const res = await fetch('https://fakestoreapi.com/products/categories');
        const categories = await res.json();
        const catList = document.getElementById('categoryList');
        categories.forEach(cat => {
            let tenVN = cat === "electronics" ? "Điện tử" : (cat === "jewelery" ? "Trang sức" : (cat === "men's clothing" ? "Thời trang Nam" : "Thời trang Nữ"));
            catList.innerHTML += `<li class="nav-item"><a class="nav-link text-capitalize" href="#" onclick="fetchProductsByCategory('${cat}')">${tenVN}</a></li>`;
        });
    } catch (e) { console.log("Lỗi danh mục"); }
}

async function fetchProductsFromAPI() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('productList').innerHTML = '';
    try {
        const response = await fetch('https://fakestoreapi.com/products?limit=16');
        const data = await response.json();
        formatProductData(data);
    } catch (error) {
        document.getElementById('productList').innerHTML = '<div class="col-12 text-center text-danger h4">Lỗi Server!</div>';
    } finally { document.getElementById('loadingIndicator').style.display = 'none'; }
}

async function fetchProductsByCategory(category) {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('productList').innerHTML = '';
    try {
        const response = await fetch(`https://fakestoreapi.com/products/category/${category}`);
        const data = await response.json();
        formatProductData(data);
    } catch (error) { console.error(error); } 
    finally { document.getElementById('loadingIndicator').style.display = 'none'; }
}

function formatProductData(data) {
    products = data.map(item => ({
        id: item.id,
        name: item.title,
        price: Math.round(item.price * 25000), 
        img: item.image,
        category: item.category,
        stock: Math.floor(Math.random() * 8) + 2 
    }));
    originalProducts = [...products];
    renderProducts(products);
}

// --- HIỂN THỊ SẢN PHẨM ---
function renderProducts(data) {
    const list = document.getElementById('productList');
    list.innerHTML = '';
    document.getElementById('productCount').innerText = data.length;
    
    if (data.length === 0) {
        list.innerHTML = '<div class="col-12 text-center text-muted p-5"><h4>Không tìm thấy sản phẩm!</h4></div>';
        return;
    }
    data.forEach(p => {
        const isWished = wishlist.find(w => w.id === p.id) ? 'bi-heart-fill text-danger' : 'bi-heart';
        list.innerHTML += `
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="card shadow-sm h-100 position-relative">
                    <button class="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm" onclick="toggleWishlist(${p.id})">
                        <i class="bi ${isWished} fs-5" id="wish-icon-${p.id}"></i>
                    </button>
                    <img src="${p.img}" class="card-img-top product-img" alt="${p.name}">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title text-truncate" title="${p.name}">${p.name}</h6>
                        <h5 class="card-text text-danger fw-bold mt-auto">${p.price.toLocaleString()} đ</h5>
                        <p class="mb-2 small">Tồn kho: ${p.stock}</p>
                        <button class="btn btn-primary w-100 fw-bold" onclick="addToCart(${p.id})"><i class="bi bi-cart-plus"></i> Thêm giỏ hàng</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    products = originalProducts.filter(p => p.name.toLowerCase().includes(keyword));
    sortProducts(); 
}

function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    let sorted = [...products];
    if (sortValue === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    else if (sortValue === 'priceDesc') sorted.sort((a, b) => b.price - a.price);
    renderProducts(sorted);
}

// --- CHỨC NĂNG WISH LIST (YÊU THÍCH) ---
function toggleWishlist(id) {
    const product = originalProducts.find(p => p.id === id);
    const index = wishlist.findIndex(w => w.id === id);
    const icon = document.getElementById(`wish-icon-${id}`);

    if (index === -1) {
        wishlist.push(product);
        if(icon) { icon.classList.remove('bi-heart'); icon.classList.add('bi-heart-fill', 'text-danger'); }
        showToast("Đã thêm vào yêu thích!", "success");
    } else {
        wishlist.splice(index, 1);
        if(icon) { icon.classList.remove('bi-heart-fill', 'text-danger'); icon.classList.add('bi-heart'); }
        showToast("Đã bỏ yêu thích", "warning");
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    document.getElementById('wishlistCount').innerText = wishlist.length;
    renderWishlist();
}

function renderWishlist() {
    document.getElementById('wishlistCount').innerText = wishlist.length;
    const list = document.getElementById('wishlistItems');
    list.innerHTML = '';
    if (wishlist.length === 0) {
        list.innerHTML = '<div class="col-12 text-center text-muted py-4">Chưa có sản phẩm yêu thích nào.</div>';
        return;
    }
    wishlist.forEach(p => {
        list.innerHTML += `
            <div class="col-md-6 mb-3">
                <div class="card p-2 d-flex flex-row align-items-center">
                    <img src="${p.img}" style="width: 60px; height: 60px; object-fit: contain;" class="me-3">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-truncate" style="max-width: 200px;">${p.name}</div>
                        <div class="text-danger">${p.price.toLocaleString()}đ</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="toggleWishlist(${p.id})"><i class="bi bi-trash"></i></button>
                    <button class="btn btn-sm btn-primary ms-2" onclick="addToCart(${p.id})"><i class="bi bi-cart"></i></button>
                </div>
            </div>
        `;
    });
}

// --- CHỨC NĂNG GIỎ HÀNG & THANH TOÁN ---
function addToCart(id) {
    const product = originalProducts.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if(existing.qty < product.stock) existing.qty += 1;
        else { showToast("Vượt quá tồn kho!", "warning"); return; }
    } else cart.push({ ...product, qty: 1 });
    
    saveCart();
    showToast("Đã thêm vào giỏ!", "success");
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const tbody = document.getElementById('cartItems');
    tbody.innerHTML = '';
    let subTotal = 0;

    cart.forEach((item, index) => {
        const rowTotal = item.price * item.qty;
        subTotal += rowTotal;
        // Lỗi gõ số âm cố ý để sinh viên test
        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.img}" style="width:40px;height:40px;object-fit:contain;" class="me-2">
                        <div class="text-truncate" style="max-width:150px;">${item.name}</div>
                    </div>
                </td>
                <td class="text-danger">${item.price.toLocaleString()}đ</td>
                <td><input type="number" class="form-control form-control-sm text-center" value="${item.qty}" onchange="updateQty(${index}, this.value)"></td>
                <td class="fw-bold">${rowTotal.toLocaleString()}đ</td>
                <td><button class="btn btn-sm btn-danger" onclick="removeItem(${index})"><i class="bi bi-trash"></i></button></td>
            </tr>
        `;
    });

    // Tính phí vận chuyển (Ship)
    let shippingFee = subTotal > 0 && subTotal < 500000 ? 30000 : 0;
    
    // Tính giảm giá từ mã (nếu có)
    if(appliedVoucher === 'TEST50') discountAmount = subTotal * 0.5;
    else if(appliedVoucher === 'FREEMONEY') discountAmount = 100000;
    
    // Tính tổng cuối
    let finalPrice = subTotal + shippingFee - discountAmount;
    
    document.getElementById('subTotal').innerText = subTotal.toLocaleString();
    document.getElementById('shippingFee').innerText = shippingFee.toLocaleString();
    document.getElementById('discountValue').innerText = discountAmount.toLocaleString();
    document.getElementById('finalPrice').innerText = finalPrice.toLocaleString();
}

function updateQty(index, val) {
    // Bug 1: Không check min = 1, sinh viên có thể gõ -5 vào ô input
    if(val > cart[index].stock) { showToast("Kho không đủ!", "warning"); val = cart[index].stock; }
    cart[index].qty = parseInt(val);
    saveCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
}

function applyVoucher() {
    const code = document.getElementById('voucherInput').value;
    const msg = document.getElementById('voucherMsg');
    
    // Bug 2: Mã có thể cộng dồn nếu người dùng bấm nhiều lần (Tùy logic xử lý)
    if(code === 'TEST50' || code === 'FREEMONEY') {
        appliedVoucher = code;
        msg.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle"></i> Áp dụng thành công!</span>';
        updateCartUI();
    } else {
        appliedVoucher = "";
        discountAmount = 0;
        msg.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle"></i> Mã không hợp lệ hoặc hết hạn!</span>';
        updateCartUI();
    }
}

async function processCheckout() {
    if (cart.length === 0) return showToast("Giỏ hàng trống!", "danger");
    if (!isLoggedIn) return showToast("Vui lòng Đăng nhập!", "danger");
    
    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    
    if(!name || !phone) return showToast("Điền đủ Họ tên & SĐT!", "warning");

    const orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        totalAmount: document.getElementById('finalPrice').innerText, // Lưu string tổng tiền
        status: "Chờ xử lý", // Trạng thái mặc định mới thêm vào
        items: cart,
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch('https://69a9490732e2d46caf45c606.mockapi.io/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if(response.ok) {
            const result = await response.json();
            showToast(`🎉 ĐẶT HÀNG THÀNH CÔNG! Mã đơn: #${result.id}`, "success");
            cart = []; appliedVoucher = ""; discountAmount = 0; saveCart();
            setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide(), 1500);
        }
    } catch (e) { showToast("Lỗi Database!", "danger"); }
}

// --- XÁC THỰC & ADMIN ---
async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === 'admin' && p === 'admin123') {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin'); 
        localStorage.setItem('userName', 'Admin Quản Trị');
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        checkAuth();
        return showToast("Đăng nhập quyền Admin!", "success");
    }

    try {
        const res = await fetch('https://fakestoreapi.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        if (res.ok) {
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'user'); 
            localStorage.setItem('userName', u);
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            checkAuth();
            showToast("Đăng nhập thành công!", "success");
        } else document.getElementById('loginError').classList.remove('d-none');
    } catch (err) { showToast("Lỗi API Login!", "danger"); }
}

function logout() {
    localStorage.clear(); 
    isLoggedIn = false; cart = []; wishlist = [];
    updateCartUI(); renderWishlist(); checkAuth();
    showToast("Đã đăng xuất!", "success");
}

function checkAuth() {
    const role = localStorage.getItem('userRole');
    if (isLoggedIn) {
        document.getElementById('btnLogin').classList.add('d-none');
        document.getElementById('btnLogout').classList.remove('d-none');
        document.getElementById('userInfo').classList.remove('d-none');
        document.getElementById('userNameDisplay').innerText = localStorage.getItem('userName') || 'Khách';
        if (role === 'admin') document.getElementById('btnAdmin').classList.remove('d-none');
        else document.getElementById('btnAdmin').classList.add('d-none');
    } else {
        document.getElementById('btnLogin').classList.remove('d-none');
        document.getElementById('btnLogout').classList.add('d-none');
        document.getElementById('userInfo').classList.add('d-none');
        document.getElementById('btnAdmin').classList.add('d-none');
    }
}

// --- ADMIN: DUYỆT ĐƠN HÀNG ---
async function loadAdminOrders() {
    const list = document.getElementById('adminOrderList');
    list.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    try {
        const res = await fetch('https://69a9490732e2d46caf45c606.mockapi.io/orders');
        const orders = await res.json();
        list.innerHTML = '';
        if(orders.length === 0) return list.innerHTML = '<tr><td colspan="5">Trống!</td></tr>';
        
        orders.reverse().forEach(o => {
            // Đổ màu Badge theo trạng thái
            let badgeClass = "bg-secondary";
            if(o.status === "Chờ xử lý") badgeClass = "bg-warning text-dark";
            if(o.status === "Đang giao") badgeClass = "bg-info text-dark";
            if(o.status === "Hoàn thành") badgeClass = "bg-success";

            list.innerHTML += `
                <tr>
                    <td class="fw-bold text-primary">#${o.id}</td>
                    <td class="text-start"><b>${o.customerName}</b><br><small>${o.customerPhone}</small></td>
                    <td class="text-danger fw-bold">${o.totalAmount} đ</td>
                    <td><span class="badge ${badgeClass}">${o.status || 'Chờ xử lý'}</span></td>
                    <td>
                        <select class="form-select form-select-sm d-inline-block w-auto me-1" id="status-${o.id}">
                            <option value="Chờ xử lý">Chờ xử lý</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                        </select>
                        <button class="btn btn-sm btn-success me-1" onclick="updateOrderStatus('${o.id}')"><i class="bi bi-check-lg"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder('${o.id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { list.innerHTML = '<tr><td colspan="5" class="text-danger">Lỗi kết nối MockAPI!</td></tr>'; }
}

async function updateOrderStatus(id) {
    const newStatus = document.getElementById(`status-${id}`).value;
    try {
        const res = await fetch(`https://69a9490732e2d46caf45c606.mockapi.io/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) {
            showToast(`Cập nhật đơn #${id} thành: ${newStatus}`, "success");
            loadAdminOrders();
        }
    } catch(e) { showToast("Cập nhật thất bại!", "danger"); }
}

async function deleteOrder(id) {
    if (!confirm(`Xóa đơn #${id}?`)) return;
    try {
        await fetch(`https://69a9490732e2d46caf45c606.mockapi.io/orders/${id}`, { method: 'DELETE' });
        showToast("Đã xóa!", "success");
        loadAdminOrders();
    } catch(e) { showToast("Lỗi xóa!", "danger"); }
}

// KHỞI CHẠY
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories(); fetchProductsFromAPI(); 
    document.getElementById('wishlistCount').innerText = wishlist.length;
    updateCartUI(); renderWishlist(); checkAuth();
});