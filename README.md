# StyleHub — Shop Thời Trang Trực Tuyến

> Ứng dụng web bán quần áo, giày dép và phụ kiện thời trang, xây dựng bằng **ReactJS** + **json-server**. Dự án Assignment môn **FER202**.

---

## Giới thiệu

**StyleHub** mô phỏng một cửa hàng thời trang online với hai nhóm người dùng:

- **Khách hàng (customer)**: xem, tìm kiếm, lọc sản phẩm; chọn **size / màu**; lưu sản phẩm yêu thích; giỏ hàng; áp **mã giảm giá**; đặt hàng; theo dõi và hủy đơn; quản lý hồ sơ cá nhân.
- **Quản trị viên (admin)**: dashboard thống kê; CRUD sản phẩm và danh mục; xử lý đơn hàng theo quy trình trạng thái; khóa / mở khóa tài khoản khách hàng.

Dữ liệu lưu trong `db.json` và được phục vụ bởi **json-server** ở cổng `9999`.

---

## Chức năng

### Khách hàng

| Trang | Đường dẫn | Chức năng |
|---|---|---|
| Trang chủ | `/` | Hero banner, danh mục kèm số lượng sản phẩm, hàng mới về, sản phẩm đang giảm giá, bán chạy nhất |
| Cửa hàng | `/shop` | Tìm kiếm **không phân biệt dấu**, lọc theo danh mục / giới tính / khoảng giá / đang sale, sắp xếp (mới nhất, bán chạy, giá, tên), **phân trang**. Bộ lọc lưu trên URL (`?category=1&sort=price-asc`) |
| Chi tiết sản phẩm | `/products/:id` | Chọn màu, size, số lượng (giới hạn theo tồn kho), thêm giỏ / mua ngay, yêu thích, tab mô tả – bảo quản – đổi trả, sản phẩm liên quan |
| Giỏ hàng | `/cart` | Mỗi dòng phân biệt theo **sản phẩm + size + màu**, sửa số lượng, xóa, thanh tiến độ miễn phí vận chuyển |
| Yêu thích | `/wishlist` | Danh sách sản phẩm đã thả tim |
| Thanh toán | `/checkout` | Validate thông tin nhận hàng, chọn COD / chuyển khoản, **áp mã giảm giá**, kiểm tra lại tồn kho trước khi tạo đơn, tự trừ kho |
| Đặt hàng thành công | `/order-success/:id` | Hiển thị mã đơn, tổng tiền |
| Đơn hàng của tôi | `/my-orders` | Lọc theo trạng thái, xem chi tiết, **hủy đơn** khi đang chờ xác nhận (tự hoàn kho) |
| Tài khoản | `/profile` | Cập nhật thông tin, đổi mật khẩu |
| Đăng nhập / Đăng ký | `/login`, `/register` | Validate form, chặn tài khoản bị khóa, quay lại trang trước sau khi đăng nhập |

### Quản trị (`/admin`)

| Trang | Chức năng |
|---|---|
| Tổng quan | Doanh thu (đơn đã giao), số đơn, số sản phẩm, số khách; đơn gần đây; biểu đồ trạng thái đơn; top bán chạy; cảnh báo sắp hết hàng |
| Sản phẩm | Tìm kiếm, lọc theo danh mục / tình trạng kho, phân trang; **thêm / sửa** bằng modal (validate từng trường, chọn nhiều size, preview ảnh, tính giá sau giảm); **xóa** có xác nhận |
| Danh mục | Thêm / sửa / xóa; đếm sản phẩm bằng `_embed`; không cho xóa danh mục còn sản phẩm |
| Đơn hàng | Lọc theo trạng thái, tìm theo mã / tên / SĐT; chuyển trạng thái theo luồng `Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao` (hoặc Hủy → hoàn kho); modal chi tiết đơn |
| Khách hàng | Danh sách tài khoản, số đơn, tổng chi tiêu; **khóa / mở khóa** tài khoản |

### Phân quyền

`ProtectedRoute` kiểm tra đăng nhập và vai trò:

- Chưa đăng nhập vào trang cần bảo vệ → chuyển về `/login` (lưu lại trang muốn vào).
- Khách hàng vào `/admin/*` → về trang chủ. Admin vào `/checkout`, `/my-orders` → về `/admin`.

---

## Công nghệ

| Công nghệ | Vai trò |
|---|---|
| React 18 (Function Component + Hooks) | Xây dựng giao diện |
| React Router v6 | Nested routes, layout route (`<Outlet />`), protected route, `useSearchParams` |
| React Bootstrap 2 + Bootstrap 5 | Navbar, Modal, Table, Form, Tabs, Toast, Pagination, ProgressBar |
| Bootstrap Icons | Icon |
| Axios | Gọi REST API (gom trong `src/services/api.js`) |
| Context API + `useReducer` | Quản lý đăng nhập, giỏ hàng, yêu thích, thông báo toast |
| json-server 0.17 | REST API giả lập, dùng `_expand`, `_embed`, `_sort`, `_order`, lọc theo field |
| localStorage | Lưu phiên đăng nhập (không lưu mật khẩu), giỏ hàng, danh sách yêu thích |

Hooks sử dụng: `useState`, `useEffect`, `useReducer`, `useContext`, `useMemo`, `useCallback`, `useParams`, `useNavigate`, `useLocation`, `useSearchParams`.

---

## Cấu trúc dữ liệu (`db.json`)

```
users       id, username, password, fullName, email, phone, address, role (admin|customer), status (active|blocked), createdAt
categories  id, name, description
products    id, name, categoryId → categories.id, gender (Nam|Nữ|Unisex), price, discount (%), stock, sold,
            sizes[], colors[], image, isNew, description, createdAt
orders      id, userId → users.id, receiver{fullName, phone, email, address, note},
            items[{productId, name, image, size, color, price, quantity}],
            subtotal, shippingFee, couponCode, discountAmount, total, paymentMethod (cod|bank),
            status (pending|confirmed|shipping|delivered|cancelled), createdAt, updatedAt
coupons     id, code, type (percent|fixed|freeship), value, maxDiscount, minOrder, description, active
```

Quan hệ: `categories 1 — N products`, `users 1 — N orders`.

---

## Cấu trúc thư mục

```
StyleHub/
├── db.json
├── package.json
├── public/index.html
└── src/
    ├── index.js                 ← Gắn các Provider + BrowserRouter
    ├── App.js                   ← Khai báo toàn bộ route
    ├── services/api.js          ← Axios instance + các hàm gọi API, cập nhật tồn kho
    ├── context/
    │   ├── AuthContext.jsx      ← login / register / logout / updateProfile / changePassword
    │   ├── CartContext.jsx      ← useReducer: ADD / UPDATE_QUANTITY / REMOVE / CLEAR
    │   ├── WishlistContext.jsx
    │   └── ToastContext.jsx
    ├── layouts/
    │   ├── MainLayout.jsx       ← Header + Outlet + Footer
    │   └── AdminLayout.jsx      ← Sidebar admin + Outlet
    ├── components/
    │   ├── Header.jsx, Footer.jsx, ProductCard.jsx, ProtectedRoute.jsx
    │   └── common.jsx           ← Loading, ErrorBox, EmptyState, PageBanner, StatusBadge, QuantityInput, Pager, ConfirmModal
    ├── pages/
    │   ├── Home, Shop, ProductDetail, Cart, Wishlist, Checkout, OrderSuccess, MyOrders, Profile, Login, Register, NotFound
    │   └── admin/ Dashboard, ManageProducts, ManageCategories, ManageOrders, ManageUsers
    ├── utils/
    │   ├── constants.js         ← API_URL, phí ship, trạng thái đơn, size, màu...
    │   └── helpers.js           ← formatCurrency, getSalePrice, applyCoupon, normalizeText...
    └── styles/ global.css, admin.css
```

---

## Cài đặt & chạy

Yêu cầu: Node.js ≥ 18.

Mở thư mục dự án bằng VS Code, mở Terminal (`Ctrl + ` `) rồi chạy:

```bash
npm install
npm start
```

Lệnh `npm start` chạy **đồng thời** json-server (http://localhost:9999) và React (http://localhost:3000), trình duyệt sẽ tự mở trang web. Nhấn `Ctrl + C` để dừng cả hai.

Hoặc chạy riêng trên 2 terminal:

```bash
npm run server   # json-server --watch db.json --port 9999
npm run client   # React app
```

---

## Tài khoản demo

| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Khách hàng | `lan.nguyen` | `123456` |
| Khách hàng | `minh.tran` | `123456` |
| Bị khóa (để test) | `spam.user` | `123456` |

Mã giảm giá: `WELCOME50` (−50.000đ, đơn từ 300k) · `SALE10` (−10% tối đa 200k, đơn từ 500k) · `FREESHIP` · `SUMMER2025` (đã hết hạn).

---

## API Endpoints chính

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/products?_expand=category` | Danh sách sản phẩm kèm danh mục |
| GET | `/products/:id?_expand=category` | Chi tiết sản phẩm |
| POST / PUT / PATCH / DELETE | `/products/:id` | Thêm / sửa / cập nhật kho / xóa sản phẩm |
| GET | `/categories?_embed=products` | Danh mục kèm sản phẩm |
| POST / PUT / DELETE | `/categories/:id` | Quản lý danh mục |
| GET | `/orders?userId=2&_sort=createdAt&_order=desc` | Đơn hàng của một khách |
| POST | `/orders` | Tạo đơn |
| PATCH | `/orders/:id` | Cập nhật trạng thái đơn |
| GET | `/users?username=...` | Đăng nhập / kiểm tra trùng username |
| POST / PATCH | `/users/:id` | Đăng ký / cập nhật hồ sơ, khóa tài khoản |
| GET | `/coupons?code=...` | Kiểm tra mã giảm giá |
