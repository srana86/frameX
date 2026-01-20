import BlogPostContainer from "../../_components/modules/blog/BlogPostContainer";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }];
}

export default function BlogPostPage({ params }: { params: { id: string } }) {
  return <BlogPostContainer params={params} />;
}
