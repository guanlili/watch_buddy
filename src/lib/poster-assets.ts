export type PosterAssetKind = "hero" | "player";

export interface PosterAsset {
  id: string;
  kind: PosterAssetKind;
  name: string;
  imageUrl: string;
  promptHint: string;
}

export const HERO_POSTER_ASSETS: PosterAsset[] = [
  {
    id: "ma-chao",
    kind: "hero",
    name: "马超",
    imageUrl: "/assets/poster-library/heroes/ma-chao.jpg",
    promptHint: "保留马超的银色武将感、长枪武器、冲锋姿态和高速突进气势。",
  },
  {
    id: "ge-ya",
    kind: "hero",
    name: "戈娅",
    imageUrl: "/assets/poster-library/heroes/ge-ya.jpg",
    promptHint: "保留戈娅的沙海机车、射手姿态、速度感和荒漠机械元素。",
  },
  {
    id: "ai-lin",
    kind: "hero",
    name: "艾琳",
    imageUrl: "/assets/poster-library/heroes/ai-lin.jpg",
    promptHint: "保留艾琳的精灵射手气质、弓箭、轻盈动作和明亮魔法粒子。",
  },
  {
    id: "a-gu-duo",
    kind: "hero",
    name: "阿古朵",
    imageUrl: "/assets/poster-library/heroes/a-gu-duo.jpg",
    promptHint: "保留阿古朵的自然系伙伴感、可爱但有战斗力的造型和丛林元素。",
  },
  {
    id: "kong-kong-er",
    kind: "hero",
    name: "空空儿",
    imageUrl: "/assets/poster-library/heroes/kong-kong-er.jpg",
    promptHint: "保留空空儿的灵巧身法、轻盈轮廓、国风奇幻感和高机动战斗姿态。",
  },
];

export const PLAYER_POSTER_ASSETS: PosterAsset[] = [
  {
    id: "xuan-ran",
    kind: "player",
    name: "轩染",
    imageUrl: "/assets/poster-library/players/xuan-ran.jpg",
    promptHint: "参考选手肖像和队服气质，生成原创电竞选手主视觉，不直接复刻原图构图。",
  },
  {
    id: "zhong-yi",
    kind: "player",
    name: "钟意",
    imageUrl: "/assets/poster-library/players/zhong-yi.jpg",
    promptHint: "参考选手肖像和队服气质，生成原创电竞选手主视觉，不直接复刻原图构图。",
  },
  {
    id: "yi-nuo",
    kind: "player",
    name: "一诺",
    imageUrl: "/assets/poster-library/players/yi-nuo.jpg",
    promptHint: "参考选手肖像和队服气质，生成原创电竞选手主视觉，不直接复刻原图构图。",
  },
  {
    id: "chang-sheng",
    kind: "player",
    name: "长生",
    imageUrl: "/assets/poster-library/players/chang-sheng.jpg",
    promptHint: "参考选手肖像和队服气质，生成原创电竞选手主视觉，不直接复刻原图构图。",
  },
  {
    id: "da-shuai",
    kind: "player",
    name: "大帅",
    imageUrl: "/assets/poster-library/players/da-shuai.jpg",
    promptHint: "参考选手肖像和队服气质，生成原创电竞选手主视觉，不直接复刻原图构图。",
  },
  {
    id: "team-photo",
    kind: "player",
    name: "团队合照",
    imageUrl: "/assets/poster-library/players/team-photo.jpg",
    promptHint: "参考团队合照的队伍氛围和队服视觉，生成原创团队胜利/复盘海报。",
  },
];

export function findPosterAsset(kind: PosterAssetKind, id: string): PosterAsset | undefined {
  const assets = kind === "hero" ? HERO_POSTER_ASSETS : PLAYER_POSTER_ASSETS;
  return assets.find((asset) => asset.id === id);
}
