import { ImageResponse } from "next/og";
import { formatPostDate, getPost } from "@/content/blog/posts";
import { ogLogoSrc } from "@/lib/og-logo";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const alt = "Blog post by Saeed";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const size = {
	width: 1200,
	height: 630,
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js reads this image metadata export.
export const contentType = "image/png";

type OpenGraphImageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
	const { slug } = await params;
	const post = getPost(slug);
	if (!post) throw new Error(`Unknown blog post: ${slug}`);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				background: "#ffffff",
				color: "#171717",
				padding: "68px 76px",
				fontFamily: "sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "16px",
					}}
				>
					{/* biome-ignore lint/performance/noImgElement: ImageResponse renders an embedded data URL and cannot use next/image. */}
					<img
						src={ogLogoSrc}
						alt=""
						width={64}
						height={64}
						style={{
							borderRadius: 999,
							border: "2px solid rgba(0, 0, 0, 0.08)",
						}}
					/>
					<span
						style={{
							fontSize: 34,
							fontWeight: 600,
							letterSpacing: "-1px",
						}}
					>
						Saeed
					</span>
				</div>
				<span
					style={{
						color: "#666666",
						fontSize: 22,
					}}
				>
					{formatPostDate(post.date)}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					maxWidth: 1040,
					fontSize: post.title.length > 55 ? 56 : 66,
					fontWeight: 700,
					lineHeight: 1.1,
					letterSpacing: "-2px",
				}}
			>
				{post.title}
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "14px",
					fontSize: 22,
				}}
			>
				<div
					style={{
						width: 16,
						height: 16,
						borderRadius: 999,
						background: "#d9653b",
					}}
				/>
				<span
					style={{
						color: "#666666",
					}}
				>
					{post.tags.join(" · ")}
				</span>
			</div>
		</div>,
		{
			...size,
		},
	);
}
