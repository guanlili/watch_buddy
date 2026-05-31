import { toast } from "sonner";

// 手机端分享统一入口：优先调起系统分享面板（微信 / 微博 / 存图等），不支持就退回复制 / 下载。

export async function shareOrCopy(opts: { title?: string; text: string; url?: string }) {
  const { title, text, url } = opts;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;

  if (nav?.share) {
    try {
      await nav.share({ title, text, url });
      return;
    } catch (err) {
      // 用户主动取消分享会抛 AbortError，不当作失败。
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  try {
    await nav?.clipboard?.writeText(url ? `${text} ${url}` : text);
    toast.success("已复制，去粘贴分享吧！");
  } catch {
    toast.error("分享失败，请手动复制");
  }
}

export async function sharePosterBlob(blob: Blob, opts: { filename?: string; text?: string } = {}) {
  const { filename = "毒奶观察室-海报.png", text } = opts;
  try {
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], text });
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    toast.success("海报已保存");
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    toast.error("海报分享失败，可长按图片保存");
  }
}

// 分享 / 保存一张图片海报：能分享文件就走系统面板（手机可直接发微信、存相册），否则触发下载。
export async function sharePosterImage(
  imageUrl: string,
  opts: { filename?: string; text?: string } = {},
) {
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`fetch poster failed: ${res.status}`);
    const blob = await res.blob();
    await sharePosterBlob(blob, opts);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    toast.error("海报分享失败，可长按图片保存");
  }
}
