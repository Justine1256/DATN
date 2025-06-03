export default function Footer() {
    return (
      <footer className="w-full bg-neutral-900 text-white pt-12 pb-8">
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Exclusive */}
          <div>
            <h3 className="text-lg font-bold mb-2">Exclusive</h3>
            <p className="text-sm mb-2">Subscribe</p>
            <p className="text-sm mb-4">Get 10% off your first order</p>
            <form className="flex border border-white rounded overflow-hidden">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm text-white bg-transparent placeholder:text-gray-400 outline-none"
              />
              <button className="bg-white text-black px-4 hover:bg-gray-300 transition">
                →
              </button>
            </form>
          </div>
  
          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-2">Support</h3>
            <p className="text-sm">111 Bijoy sarani, Dhaka, DH 1515, Bangladesh.</p>
            <p className="text-sm">vannhatcr123@gmail.com</p>
            <p className="text-sm">0978740071</p>
          </div>
  
          {/* Account */}
          <div>
            <h3 className="text-lg font-bold mb-2">Account</h3>
            <ul className="space-y-1 text-sm">
              <li>My Account</li>
              <li>Login / Register</li>
              <li>Cart</li>
              <li>Wishlist</li>
              <li>Shop</li>
            </ul>
          </div>
  
          {/* Quick Link */}
          <div>
            <h3 className="text-lg font-bold mb-2">Quick Link</h3>
            <ul className="space-y-1 text-sm">
              <li>Privacy Policy</li>
              <li>Terms Of Use</li>
              <li>FAQ</li>
              <li>Contact</li>
            </ul>
          </div>
  
          {/* Download App */}
          <div>
            <h3 className="text-lg font-bold mb-2">Download App</h3>
            <p className="text-sm mb-2">Save $3 with App New User Only</p>
            <div className="flex gap-2 mb-3">
              <img src="/qr.png" alt="QR" className="w-16 h-16" />
              <div className="flex flex-col gap-2">
                <img src="/google-play.png" alt="Google Play" className="w-24" />
                <img src="/app-store.png" alt="App Store" className="w-24" />
              </div>
            </div>
            <div className="flex gap-4 text-xl text-gray-400">
              <i className="fab fa-facebook-f cursor-pointer hover:text-white" />
              <i className="fab fa-twitter cursor-pointer hover:text-white" />
              <i className="fab fa-instagram cursor-pointer hover:text-white" />
              <i className="fab fa-linkedin-in cursor-pointer hover:text-white" />
            </div>
          </div>
        </div>
      </footer>
    );
  }
  