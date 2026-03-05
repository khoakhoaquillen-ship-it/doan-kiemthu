let products = [];
let originalProducts = []; // Lưu lại mảng gốc để sắp xếp
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// --- HIỂN THỊ THÔNG BÁO (TOAST) THAY VÌ ALERT ---
function showToast(message, type = 'success') {
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-warning');
    const toastHTML = `
        <div class="toast align-items-center text-white ${bgClass} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
    const container = document.getElementById('toastContainer');
    container.insertAdjacentHTML('beforeend', toastHTML);
    
    // Tự động xóa toast sau 3 giây
    const newToast = container.lastElementChild;
    setTimeout(() => {
        if(newToast) newToast.remove();
    }, 3000);
}

// --- MODULE: API SẢN PHẨM & DANH MỤC ---
async function fetchCategories() {
    try {
        const res = await fetch('https://fakestoreapi.com/products/categories');
        const categories = await res.json();
        const catList = document.getElementById('categoryList');
        categories.forEach(cat => {
            // Dịch tạm tên danh mục sang tiếng Việt
            let tenVN = cat;
            if(cat === "electronics") tenVN = "Điện tử";
            if(cat === "jewelery") tenVN = "Trang sức";
            if(cat === "men's clothing") tenVN = "Thời trang Nam";
            if(cat === "women's clothing") tenVN = "Thời trang Nữ";
            
            catList.innerHTML += `<li class="nav-item"><a class="nav-link text-capitalize" href="#" onclick="fetchProductsByCategory('${cat}')">${tenVN}</a></li>`;
        });
    } catch (e) {
        console.log("Không tải được danh mục");
    }
}

async function fetchProductsFromAPI() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('productList').innerHTML = '';
    try {
        const response = await fetch('https://fakestoreapi.com/products?limit=12');
        const data = await response.json();
        formatProductData(data);
    } catch (error) {
        document.getElementById('productList').innerHTML = '<div class="col-12 text-center text-danger h4">Lỗi kết nối API Server!</div>';
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

async function fetchProductsByCategory(category) {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('productList').innerHTML = '';
    try {
        const response = await fetch(`https://fakestoreapi.com/products/category/${category}`);
        const data = await response.json();
        formatProductData(data);
    } catch (error) {
        console.error(error);
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

function formatProductData(data) {
    products = data.map(item => ({
        id: item.id,
        name: item.title,
        price: Math.round(item.price * 25000), 
        img: item.image,
        category: item.category,
        stock: Math.floor(Math.random() * 8) + 2 // Tồn kho từ 2-10
    }));
    originalProducts = [...products];
    renderProducts(products);
}

// --- MODULE: RENDER, TÌM KIẾM & SẮP XẾP ---
function renderProducts(data) {
    const list = document.getElementById('productList');
    list.innerHTML = '';
    document.getElementById('productCount').innerText = data.length;
    
    if (data.length === 0) {
        list.innerHTML = '<div class="col-12 text-center text-muted p-5"><h4><i class="bi bi-box-seam"></i> Không tìm thấy sản phẩm nào!</h4></div>';
        return;
    }
    data.forEach(p => {
        list.innerHTML += `
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="card shadow-sm h-100">
                    <img src="${p.img}" class="card-img-top product-img" alt="${p.name}">
                    <div class="card-body d-flex flex-column">
                        <small class="text-muted text-capitalize mb-1">${p.category}</small>
                        <h6 class="card-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${p.name}">${p.name}</h6>
                        <h5 class="card-text text-danger fw-bold mt-auto">${p.price.toLocaleString()} đ</h5>
                        <p class="mb-3 small"><span class="badge bg-secondary"><i class="bi bi-box"></i> Tồn kho: ${p.stock}</span></p>
                        <button class="btn btn-primary w-100 fw-bold" onclick="addToCart(${p.id})"><i class="bi bi-cart-plus"></i> Thêm vào giỏ</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filtered = originalProducts.filter(p => p.name.toLowerCase().includes(keyword));
    products = filtered;
    sortProducts(); // Áp dụng cả bộ lọc sắp xếp hiện tại
}

function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    let sortedArray = [...products];
    
    if (sortValue === 'priceAsc') {
        sortedArray.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'priceDesc') {
        sortedArray.sort((a, b) => b.price - a.price);
    }
    renderProducts(sortedArray);
}

// --- MODULE: GIỎ HÀNG ---
function addToCart(id) {
    const product = originalProducts.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        if(existingItem.qty < product.stock) {
            existingItem.qty += 1;
        } else {
            showToast("Đã đạt giới hạn tồn kho của sản phẩm này!", "warning");
            return;
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    showToast(`Đã thêm <b>${product.name.substring(0, 20)}...</b> vào giỏ!`, "success");
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const rowTotal = item.price * item.qty;
        total += rowTotal;
        cartItems.innerHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.img}" style="width: 40px; height: 40px; object-fit: contain;" class="me-2">
                        <div style="max-width: 150px;" class="text-truncate fw-bold" title="${item.name}">${item.name}</div>
                    </div>
                </td>
                <td class="text-danger">${item.price.toLocaleString()}đ</td>
                <td>
                    <input type="number" class="form-control form-control-sm text-center" value="${item.qty}" min="1" max="${item.stock}" onchange="updateQty(${index}, this.value)">
                </td>
                <td class="fw-bold">${rowTotal.toLocaleString()}đ</td>
                <td><button class="btn btn-sm btn-outline-danger" onclick="removeItem(${index})"><i class="bi bi-trash3"></i></button></td>
            </tr>
        `;
    });
    document.getElementById('totalPrice').innerText = total.toLocaleString();
}

function updateQty(index, newQty) {
    if (newQty < 1) return removeItem(index);
    if (newQty > cart[index].stock) {
        showToast("Kho không đủ số lượng bạn yêu cầu!", "warning");
        newQty = cart[index].stock;
    }
    cart[index].qty = parseInt(newQty);
    saveCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    showToast("Đã xóa sản phẩm khỏi giỏ hàng", "warning");
}

// --- LOGIC THANH TOÁN GỌI DATABASE THẬT (MOCKAPI CỦA NHÓM BẠN) ---
async function processCheckout() {
    if (cart.length === 0) {
        showToast("Giỏ hàng đang trống! Vui lòng chọn sản phẩm.", "danger");
        return;
    }
    if (!isLoggedIn) {
        showToast("Bạn phải Đăng nhập trước khi thanh toán!", "danger");
        return;
    }
    
    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    
    // CỐ TÌNH ĐỂ LỖI: Chỉ check rỗng, KHÔNG check định dạng SĐT (bấm chữ "abc" vào SĐT vẫn cho qua)
    // Sinh viên dùng Cypress sẽ bắt được Bug này cực kỳ ngon!
    if(name.trim() === '' || phone.trim() === '') {
        showToast("Vui lòng điền đầy đủ Họ Tên và Số điện thoại!", "warning");
        return;
    }

    // Đổi nút thành trạng thái Đang tải
    const btn = document.querySelector('button[onclick="processCheckout()"]');
    const originalText = btn.innerText;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ĐANG LƯU VÀO DATABASE...';
    btn.disabled = true;

    // Chuẩn bị dữ liệu để đưa vào Database
    const orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        totalAmount: document.getElementById('totalPrice').innerText,
        items: cart,
        createdAt: new Date().toISOString()
    };

    try {
        // GỌI API ĐẾN ĐƯỜNG LINK MOCKAPI CỦA BẠN
        const response = await fetch('https://69a9490732e2d46caf45c606.mockapi.io/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if(response.ok) {
            const result = await response.json();
            showToast(`🎉 ĐẶT HÀNG THÀNH CÔNG! Mã đơn: #${result.id}`, "success");
            
            // Xóa giỏ hàng và form sau khi lưu thành công
            cart = []; 
            saveCart();
            document.getElementById('checkoutName').value = '';
            document.getElementById('checkoutPhone').value = '';
            document.getElementById('checkoutAddress').value = '';
            
            setTimeout(() => {
                const modalEl = document.getElementById('cartModal');
                if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
            }, 1500);
        } else {
            showToast("Lỗi khi lưu vào Database! Vui lòng kiểm tra lại cấu hình MockAPI.", "danger");
        }
    } catch (error) {
        showToast("Lỗi mạng! Không thể kết nối tới Database.", "danger");
    } finally {
        if(btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// --- MODULE: XÁC THỰC (LOGIN/LOGOUT) ---
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitLogin');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';
    document.getElementById('loginError').classList.add('d-none');

    const username = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    try {
        const res = await fetch('https://fakestoreapi.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: pass })
        });

        if (res.ok) {
            const json = await res.json();
            localStorage.setItem('token', json.token); 
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            
            const modalEl = document.getElementById('loginModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
            
            checkAuth();
            showToast("Đăng nhập thành công!", "success");
        } else {
            document.getElementById('loginError').classList.remove('d-none');
        }
    } catch (err) {
        showToast("Lỗi mạng khi kết nối API Server!", "danger");
    } finally {
        btn.disabled = false;
        btn.innerText = "ĐĂNG NHẬP";
    }
}

function logout() {
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    checkAuth();
    showToast("Đã đăng xuất tài khoản!", "success");
}

function checkAuth() {
    if (isLoggedIn) {
        document.getElementById('btnLogin').classList.add('d-none');
        document.getElementById('btnLogout').classList.remove('d-none');
        document.getElementById('userInfo').classList.remove('d-none');
    } else {
        document.getElementById('btnLogin').classList.remove('d-none');
        document.getElementById('btnLogout').classList.add('d-none');
        document.getElementById('userInfo').classList.add('d-none');
    }
}

// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchProductsFromAPI();
    updateCartUI();
    checkAuth();
});