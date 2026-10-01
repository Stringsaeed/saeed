export type DimensionsMm = {
  width: number;
  height: number;
  depth: number;
};

export type StripeFinish = {
  shininess: number;
  thickness: number;
  diffuseMapCustom: string;
  diffuseBaseColor: [
    number,
    number,
    number,
  ];
  bumpMapBase: string;
  bumpScaleBase: number;
  bumpMapCustom: string;
  bumpScaleCustom: number;
  foilMap: string;
  foilDetail: number;
  foilSpecular: number;
  foilOpacity: number;
  reflectiveness: number;
  glossMap?: string;
  glossSpecular?: number;
  glossOpacity?: number;
};

export type BookModel = {
  id: string;
  title: string;
  author: string;
  dimensionsMm: DimensionsMm;
  measurement: string;
} & (
  | {
      kind: "stripe";
      asset: {
        mesh: string;
        vertexShader: string;
        fragmentShader: string;
        diffuseOverlay: string;
      };
      finish: StripeFinish;
    }
  | {
      kind: "bound";
      binding: "hardcover" | "paperback";
      artwork: {
        front: string;
        back: string;
        spine: string;
      };
      construction: {
        boardMm: number;
        overhangMm: number;
        spineRadiusMm: number;
        roughness: number;
        jacket: boolean;
      };
    }
);
