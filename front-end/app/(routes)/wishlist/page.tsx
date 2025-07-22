import Wishlist from '@/app/components/wishlist/Wishlist';
import JustForYou from '@/app/components/wishlist/JustForYou';
import { WishlistProvider } from '@/app/context/WishlistContext';

export default function WishlistPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <Wishlist />
      </section>
      <section>
        <JustForYou />
      </section>
    </div>
  );
}
