/**
 * 資格名のプルダウンに出す一覧（2026-10-31 時点で受けられる AWS 認定資格）。
 * 資格が増えたり終わったりしたら、ここだけを直す。
 * 【】は試験コードの頭の3文字の略称。資格名はこの形のまま保存・表示する。
 */
export const QUALIFICATION_GROUPS = [
  {
    label: "基礎（Foundational）",
    items: [
      "AWS Certified Cloud Practitioner【CLF】",
      "AWS Certified AI Practitioner【AIF】",
    ],
  },
  {
    label: "アソシエイト（Associate）",
    items: [
      "AWS Certified Solutions Architect - Associate【SAA】",
      "AWS Certified Developer - Associate【DVA】",
      // 以前の SysOps Administrator の試験コード（SOA-C03）を引き継いでいる
      "AWS Certified CloudOps Engineer - Associate【SOA】",
      "AWS Certified Data Engineer - Associate【DEA】",
      "AWS Certified Machine Learning Engineer - Associate【MLA】",
    ],
  },
  {
    label: "プロフェッショナル（Professional）",
    items: [
      "AWS Certified Solutions Architect - Professional【SAP】",
      "AWS Certified DevOps Engineer - Professional【DOP】",
      "AWS Certified Generative AI Developer - Professional【AIP】",
    ],
  },
  {
    label: "専門知識（Specialty）",
    items: ["AWS Certified Security - Specialty【SCS】"],
  },
] as const;

/** プルダウンで「その他（自分で入力）」を選んだときの値 */
export const OTHER_QUALIFICATION = "__other__";
