"use client";

export default function ProductHunt({ width = 200 }) {
    return (
        <a 
            href="https://www.producthunt.com/posts/amurex?utm_source=badge-featured&utm_medium=badge" 
            target="_blank" 
            rel="noopener noreferrer"
        >
            <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=946652&theme=light" 
                alt="Amurex - AI companion to organize, retrieve and act on your workflows" 
                width={width}
                className="hover:opacity-90 transition-opacity"
            />
        </a>
    )
}