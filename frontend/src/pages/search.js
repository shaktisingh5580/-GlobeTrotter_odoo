import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SearchPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/explore');
  }, []);
  return null;
}
