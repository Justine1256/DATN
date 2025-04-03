// components/Footer.js

import styles from './style/Footer.module.css';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles['footer-section']}>
          <h3 className={styles['section-title']}>DỊCH VỤ KHÁCH HÀNG</h3>
          <a href="#">Trung Tâm Trợ Giúp Shopee</a>
          <a href="#">Shopee Blog</a>
          <a href="#">Shopee Mall</a>
          <a href="#">Hướng Dẫn Mua Hàng Đặt Hàng</a>
          <a href="#">Hướng Dẫn Bán Hàng</a>
          <a href="#">Ví Shopee Pay</a>
          <a href="#">Shopee Xu</a>
          <a href="#">Đơn Hàng</a>
          <a href="#">Trả Hàng & Hoàn Tiền</a>
          <a href="#">Liên Hệ Shopee</a>
          <a href="#">Chính Sách Bảo Hành</a>
        </div>
        <div className={styles['footer-section']}>
          <h3 className={styles['section-title']}>SHOPEE VIỆT NAM</h3>
          <a href="#">Về Shopee</a>
          <a href="#">Tuyển Dụng</a>
          <a href="#">Điều Khoản Shopee</a>
          <a href="#">Chính Sách Bảo Mật</a>
          <a href="#">Shopee Mall</a>
          <a href="#">Kênh Người Bán</a>
          <a href="#">Flash Sale</a>
          <a href="#">Tiếp Thị Liên Kết</a>
          <a href="#">Liên Hệ Truyền Thông</a>
        </div>
        <div className={styles['footer-section']}>
          <h3 className={styles['section-title']}>THANH TOÁN</h3>
          <div className={styles['payment-icons']}>
            <div className={styles['payment-row']}>
              <Image src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Visa" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/a0a9062ebe19b45c1ae0506f16af5c16" alt="Mastercard" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/38fd98e55806c3b2e4535c4e4a6c4c08" alt="JCB" width={52} height={22} />
            </div>
            <div className={styles['payment-row']}>
              <Image src="https://down-vn.img.susercontent.com/file/bc2a874caeee705449c164be385b796c" alt="American Express" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/2c46b83d84111ddc32cfd3b5995d9281" alt="Timo" width={52} height={22} />
            </div>
          </div>
          <h3 className={styles['section-title']}>ĐƠN VỊ VẬN CHUYỂN</h3>
          <div className={styles['shipping-icons']}>
            <div className={styles['shipping-row']}>
              <Image src="https://down-vn.img.susercontent.com/file/957f4eec32b963115f952835c779cd2c" alt="SPX" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/59270fb2f3fbb7cbc92fca3877edde3f" alt="Viettel" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/vn-50009109-ec3ae587db6309b791b78eb8af6793fd" alt="J&T" width={52} height={22} />
            </div>
            <div className={styles['shipping-row']}>
              <Image src="https://down-vn.img.susercontent.com/file/0d349e22ca8d4337d11c9b134cf9fe63" alt="Ninja Van" width={52} height={22} />
              <Image src="https://down-vn.img.susercontent.com/file/vn-50009109-64f0b242486a67a3d29fd4bcf024a8c6" alt="Be" width={52} height={22} />
            </div>
          </div>
        </div>
        <div className={styles['footer-section']}>
          <h3 className={styles['section-title']}>THEO DÕI SHOPEE</h3>
          <div className={styles['social-links']}>
            <a href="#">
              <Image src="https://down-vn.img.susercontent.com/file/2277b37437aa470fd1c71127c6ff8eb5" alt="Facebook" width={20} height={20} />
              <span>Facebook</span>
            </a>
            <a href="#">
              <Image src="https://down-vn.img.susercontent.com/file/5973ebbc642ceee80a504a81203bfb91" alt="Instagram" width={20} height={20} />
              <span>Instagram</span>
            </a>
            <a href="#">
              <Image src="https://down-vn.img.susercontent.com/file/f4f86f1119712b553992a75493065d9a" alt="LinkedIn" width={20} height={20} />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
        <div className={styles['footer-section']}>
          <h3 className={styles['section-title']}>TẢI ỨNG DỤNG SHOPEE</h3>
          <div className={styles['app-download']}>
            <Image src="https://down-vn.img.susercontent.com/file/a5e589e8e118e937dc660f224b9a1472" alt="QR Code" width={80} height={80} />
            <div className={styles['app-icons']}>
              <Image src="https://down-vn.img.susercontent.com/file/ad01628e90ddf248076685f73497c163" alt="App Store" width={68} height={16} />
              <Image src="https://down-vn.img.susercontent.com/file/ae7dced05f7243d0f3171f786e123def" alt="Google Play" width={68} height={16} />
              <Image src="https://down-vn.img.susercontent.com/file/35352374f39bdd03b25e7b83542b2cb0" alt="AppGallery" width={68} height={16} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles['footer-bottom']}>
        © 2025 Shopee. Tất cả các quyền được bảo lưu. Quốc gia & Khu vực: Singapore, Indonesia, Thái Lan, Malaysia, Việt Nam, Philippines, Brazil, México, Colombia, Chile, Đài Loan
      </div>
    </footer>
  );
};

export default Footer;