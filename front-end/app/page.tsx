import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Marketo</title>
        <meta name="description" content="Mô tả ngắn về trang của bạn" />
        {/* Bạn cũng có thể thêm các meta tag khác tại đây */}
      </Head>

      {/* Nội dung trang của bạn */}
      <h1>Chào mừng đến trang chủ!</h1>
    </div>
  );
}