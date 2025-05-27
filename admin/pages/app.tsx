// pages/_app.tsx
import "./global.css"; // chỉnh đường dẫn tùy vị trí thật

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
