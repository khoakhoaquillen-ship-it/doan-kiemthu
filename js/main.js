// --- KHỞI TẠO BIẾN TOÀN CỤC ---
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// --- MODULE: GỌI API LẤY SẢN PHẨM ---
async function fetchProductsFromAPI() {
    document.getElementById('loadingIndicator').style.display = 'block';
    try {
        const response = await fetch('https://fakestoreapi.com/products?limit=8');
        const data = await response.json();
        
        products = data.map(item => ({
            id: item.id,
            name: item.title,
            price: Math.round(item.price * 25000), 
            img: item.image,
            stock: Math.floor(Math.random() * 10) + 1 
        }));
        
        renderProducts(products);
    } catch (error) {
        console.error("Lỗi API:", error);
        document.getElementById('productList').innerHTML = '<div class="col-12 text-center text-danger">Lỗi kết nối API! Vui lòng thử lại.</div>';
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// --- MODULE: RENDER & TÌM KIẾM ---
function renderProducts(data) {
    const list = document.getElementById('productList');
    list.innerHTML = '';
    if (data.length === 0) {
        list.innerHTML = '<div class="col-12 text-center text-muted">Không tìm thấy sản phẩm nào!</div>';
        return;
    }
    data.forEach(p => {
        list.innerHTML += `
            <div class="col-md-3 mb-4">
                <div class="card shadow-sm h-100">
                    <img src="${p.img}" class="card-img-top product-img" alt="${p.name}">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title text-truncate" title="${p.name}">${p.name}</h6>
                        <p class="card-text text-danger fw-bold">${p.price.toLocaleString()} đ</p>
                        <p class="mb-2"><span class="badge bg-info">Tồn kho: ${p.stock}</span></p>
                        <button class="btn btn-primary mt-auto" onclick="addToCart(${p.id})">Thêm vào giỏ</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(keyword));
    renderProducts(filtered);
}

// --- MODULE: GIỎ HÀNG ---
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        if(existingItem.qty < product.stock) {
            existingItem.qty += 1;
        } else {
            alert("Đã đạt giới hạn tồn kho của sản phẩm này!");
            return;
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    alert("Đã thêm vào giỏ!");
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
                <td style="max-width: 150px;" class="text-truncate" title="${item.name}">${item.name}</td>
                <td>${item.price.toLocaleString()}</td>
                <td>
                    <input type="number" value="${item.qty}" min="1" max="${item.stock}" style="width: 60px" onchange="updateQty(${index}, this.value)">
                </td>
                <td>${rowTotal.toLocaleString()}</td>
                <td><button class="btn btn-sm btn-danger" onclick="removeItem(${index})">Xóa</button></td>
            </tr>
        `;
    });
    document.getElementById('totalPrice').innerText = total.toLocaleString();
}

function updateQty(index, newQty) {
    if (newQty < 1) return removeItem(index);
    if (newQty > cart[index].stock) {
        alert("Không đủ hàng trong kho!");
        newQty = cart[index].stock;
    }
    cart[index].qty = parseInt(newQty);
    saveCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
}

function checkout() {
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    if (!isLoggedIn) return alert("Bạn cần đăng nhập để thanh toán!");
    alert("Thanh toán thành công! Sẽ gọi API tạo đơn hàng (Mock).");
    cart = []; saveCart();
    
    // Ẩn modal giỏ hàng sau khi thanh toán
    const modalEl = document.getElementById('cartModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

// --- MODULE: XÁC THỰC (LOGIN/LOGOUT) ---
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitLogin');
    btn.disabled = true;
    btn.innerText = "Đang xử lý...";
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
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            
            checkAuth();
            alert("Đăng nhập thành công! Đã lưu Token.");
        } else {
            document.getElementById('loginError').classList.remove('d-none');
        }
    } catch (err) {
        alert("Lỗi mạng khi kết nối API!");
    } finally {
        btn.disabled = false;
        btn.innerText = "Đăng nhập";
    }
}

function logout() {
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    checkAuth();
    alert("Đã đăng xuất & Xóa Token!");
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

// --- KHỞI CHẠY HỆ THỐNG KHI LOAD TRANG ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromAPI();
    updateCartUI();
    checkAuth();
});