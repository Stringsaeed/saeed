import { HomeScreen } from "@/components/os/home-screen";
import { PlatformSwitch } from "@/components/os/platform-switch";
import { WebHome } from "@/components/os/web-home";
import { getPosts } from "@/lib/content";

export default async function Home() {
  const posts = await getPosts();
  return (
    <PlatformSwitch
      phone={<HomeScreen posts={posts.slice(0, 3)} />}
      web={<WebHome posts={posts.slice(0, 5)} />}
    />
  );
}
