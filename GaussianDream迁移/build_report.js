const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.author = "Researcher";
pres.title = "VLA 论文调研报告 · 3D 表征融入 VLA";

// ---------- design tokens ----------
const C = {
  bg: "F4F5F7",
  paper: "FFFFFF",
  ink: "1B2440",
  sub: "586189",
  muted: "8A92B2",
  navy: "1E2A5A",      // dominant dark
  blue: "2E5BFF",      // accent / 3D path
  teal: "0FB9A8",      // supporting / flow
  coral: "FF6B5B",     // sharp accent / losses
  amber: "FFB020",     // highlight numbers
  line: "D9DEEA",
  softBlue: "EAF0FF",
  softTeal: "E2F7F4",
  softCoral: "FFECE8",
  softAmber: "FFF4DF",
};
const F = { h: "Arial", b: "Calibri" };
const W = 13.333, H = 7.5;

// ---------- helpers ----------
function bg(slide, color) { slide.background = { color: color || C.bg }; }
function header(slide, kicker, title, num) {
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.18, fill: { color: C.navy } });
  slide.addText(kicker, { x: 0.55, y: 0.18, w: 8, h: 0.28, fontFace: F.b, fontSize: 11, color: C.teal, bold: true, charSpacing: 2, margin: 0 });
  slide.addText(title, { x: 0.55, y: 0.45, w: 11, h: 0.6, fontFace: F.h, fontSize: 27, color: "FFFFFF", bold: true, margin: 0 });
  slide.addText(String(num).padStart(2, "0"), { x: 12.2, y: 0.35, w: 0.7, h: 0.5, fontFace: F.h, fontSize: 20, color: C.muted, align: "right", margin: 0 });
}
function footer(slide, text) {
  slide.addText(text || "GaussianDream · 3D 表征主线", { x: 0.55, y: 7.12, w: 9, h: 0.24, fontFace: F.b, fontSize: 9, color: C.muted, margin: 0 });
}
function card(slide, x, y, w, h, fill, stroke) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08,
    fill: { color: fill || C.paper }, line: { color: stroke || C.line, width: 1 } });
}
function pill(slide, x, y, w, h, text, fill, color, fs) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { color: fill } });
  slide.addText(text, { x, y: y + 0.01, w, h: h - 0.02, fontFace: F.b, fontSize: fs || 11, color: color || "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0 });
}
function arrow(slide, x1, y1, x2, y2, color, w) {
  slide.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: color || C.blue, width: w || 2, endArrowType: "triangle", endArrowSize: 2 } });
}
function sectionTag(slide, x, y, n, title, color) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color: color } });
  slide.addText(String(n), { x, y: y + 0.01, w: 0.42, h: 0.4, fontFace: F.h, fontSize: 15, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0 });
  slide.addText(title, { x: x + 0.55, y: y + 0.01, w: 5.5, h: 0.42, fontFace: F.h, fontSize: 15, color: C.ink, bold: true, valign: "middle", margin: 0 });
}

// ================= Slide 1: title =================
{
  const s = pres.addSlide(); bg(s, C.navy);
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.16, h: H, fill: { color: C.blue } });
  // decorative point cloud (small dots, like 3D Gaussians)
  const dots = [[10.6,1.0,0.10,C.blue],[11.4,1.4,0.07,C.teal],[12.2,0.9,0.13,C.coral],[11.0,2.3,0.09,C.amber],[12.6,2.0,0.06,C.blue],[10.2,1.9,0.05,C.teal],[12.0,2.8,0.11,C.blue],[11.5,3.3,0.07,C.coral],[10.8,3.0,0.08,C.teal]];
  dots.forEach(([x,y,d,c]) => s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: c } }));
  s.addText("VLA 论文调研报告", { x: 0.8, y: 1.55, w: 9.5, h: 0.9, fontFace: F.h, fontSize: 46, color: "FFFFFF", bold: true, margin: 0 });
  s.addText("3D 表征融入 VLA · 后训练与可复现性探索", { x: 0.82, y: 2.5, w: 9.5, h: 0.5, fontFace: F.b, fontSize: 21, color: C.teal, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.82, y: 3.2, w: 4.6, h: 0.03, fill: { color: C.blue } });
  s.addText(["调研对象：GaussianDream · VistaVLA · Aerial Manipulation · GSP-3D · PEAR",
             "重点：GaussianDream 的 3D 表征主线（本篇先讲）",
             "目标：为「3D 表征 + VLA 后训练」的 CVPR 选题找创新点与基线"].map((t,i)=>({text:t, options:{bullet:{type:"bullet"}, breakLine:i<2, color:"D7DEFF", fontSize:14}})),
    { x: 0.85, y: 3.6, w: 8.7, h: 1.6, fontFace: F.b, margin: 0 });
  s.addText("2026 · 11", { x: 0.82, y: 6.45, w: 3, h: 0.4, fontFace: F.b, fontSize: 13, color: C.muted, margin: 0 });
}

// ================= Slide 2: roadmap =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "ROADMAP", "调研范围与主线", 2);
  // main line
  s.addText("研究主线", { x: 0.6, y: 1.5, w: 3, h: 0.4, fontFace: F.h, fontSize: 16, color: C.ink, bold: true, margin: 0 });
  const steps = [["① 3D 表征", "GaussianDream / VistaVLA / GSP-3D", C.softBlue, C.blue],
                 ["② VLA 后训练", "PEAR · GRPO / 仿真 RL", C.softTeal, C.teal],
                 ["③ 目标", "CVPR · 创新点 + 强基线", C.softCoral, C.coral]];
  steps.forEach(([t,d,fill,c],i)=>{
    const x = 0.6 + i*4.15;
    card(s, x, 2.0, 3.85, 1.5, fill, c);
    s.addText(t, { x: x+0.22, y: 2.18, w: 3.4, h: 0.45, fontFace: F.h, fontSize: 18, color: c, bold: true, margin: 0 });
    s.addText(d, { x: x+0.22, y: 2.72, w: 3.4, h: 0.6, fontFace: F.b, fontSize: 12, color: C.sub, margin: 0 });
    if(i<2) arrow(s, x+3.9, 2.75, x+4.12, 2.75, C.muted, 1.5);
  });
  // paper list
  s.addText("论文清单（状态）", { x: 0.6, y: 3.85, w: 4, h: 0.4, fontFace: F.h, fontSize: 16, color: C.ink, bold: true, margin: 0 });
  const rows = [
    ["GaussianDream", "VLA + 训练期 3DGS 插件", "已精读", C.teal],
    ["VistaVLA", "3D Gaussian grounded VLA (NTU)", "待补充", C.muted],
    ["Aerial Manipulation", "场景级空中操作 VLA (NTU)", "待补充", C.muted],
    ["GSP-3D", "3DGS + diffusion policy", "待补充", C.muted],
    ["PEAR", "RL 后训练框架 (MIT HAN)", "已概览", C.blue],
  ];
  rows.forEach((r,i)=>{
    const y = 4.32 + i*0.5;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.44, fill: { color: i%2? "FFFFFF":"F0F3FA" }, line: { color: C.line, width: 0.5 } });
    s.addText(r[0], { x: 0.78, y: y+0.05, w: 3.2, h: 0.34, fontFace: F.b, fontSize: 13, color: C.ink, bold: true, valign:"middle", margin: 0 });
    s.addText(r[1], { x: 4.0, y: y+0.05, w: 6.5, h: 0.34, fontFace: F.b, fontSize: 12, color: C.sub, valign:"middle", margin: 0 });
    pill(s, 11.0, y+0.06, 1.5, 0.32, r[2], r[3], "FFFFFF", 10);
  });
  footer(s, "本报告先展开 GaussianDream 的 3D 表征线，其余论文后续补充");
}

// ================= Slide 3: GaussianDream positioning =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "GAUSSIANDREAM · 定位", "它是 VLA，不是 WMA", 3);
  card(s, 0.6, 1.5, 6.0, 2.15, C.softBlue, C.blue);
  s.addText("一句话", { x: 0.85, y: 1.68, w: 2, h: 0.32, fontFace: F.b, fontSize: 11, color: C.blue, bold: true, margin: 0 });
  s.addText("训练期借 3D 高斯世界模型做密集监督，\n推理期丢掉所有辅助头、只留 prefix 出动作的轻量 VLA。", { x: 0.85, y: 2.05, w: 5.5, h: 1.35, fontFace: F.b, fontSize: 15, color: C.ink, margin: 0 });
  card(s, 6.85, 1.5, 5.85, 2.15, C.paper, C.line);
  s.addText("判据：推理时谁产出动作？", { x: 7.1, y: 1.68, w: 5, h: 0.35, fontFace: F.h, fontSize: 14, color: C.ink, bold: true, margin: 0 });
  s.addText([
    { text: "WMA：世界模型 rollout → 再规划动作（重、慢）", options: { bullet:true, breakLine:true, color:C.sub, fontSize:12 } },
    { text: "GaussianDream：普通 VLA denoise 出动作（轻、快）", options: { bullet:true, color:C.teal, fontSize:12, bold:true } },
  ], { x: 7.1, y: 2.12, w: 5.3, h: 1.2, fontFace: F.b, margin: 0 });
  // stats
  const stats = [["1024", "GaussianDream query\n= 32×32 网格", C.blue], ["65536", "每帧高斯数\n= 256×256", C.teal], ["98.4%", "LIBERO 平均\n成功率", C.coral], ["0", "推理期额外\n渲染/解码开销", C.amber]];
  stats.forEach(([n,l,c],i)=>{
    const x = 0.6 + i*3.08;
    card(s, x, 3.95, 2.85, 1.75, C.paper, C.line);
    s.addText(n, { x: x+0.2, y: 4.12, w: 2.45, h: 0.62, fontFace: F.h, fontSize: 32, color: c, bold: true, margin: 0 });
    s.addText(l, { x: x+0.2, y: 4.8, w: 2.45, h: 0.75, fontFace: F.b, fontSize: 11, color: C.sub, margin: 0 });
  });
  card(s, 0.6, 5.95, 12.1, 0.85, C.navy, C.navy);
  s.addText("非对称设计 = 核心创新：", { x: 0.85, y: 6.15, w: 3.2, h: 0.45, fontFace: F.h, fontSize: 14, color: C.teal, bold: true, valign:"middle", margin: 0 });
  s.addText("重监督全塞进训练期（重建+未来+渲染+深度+flow）→ 推理零痕迹，只剩信息丰富的 prefix", { x: 3.7, y: 6.15, w: 8.7, h: 0.45, fontFace: F.b, fontSize: 12.5, color: "D7DEFF", valign:"middle", margin: 0 });
  footer(s);
}

// ================= Slide 4: full chain diagram =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "GAUSSIANDREAM · 3D 表征主线", "一条链看懂：从图像到 3D prefix 再到监督", 4);
  // row 1
  const n1 = [
    ["3 帧历史 RGB", "t-10 / t-5 / t\nresize 518²", C.softAmber, C.amber],
    ["VGGT aggregator", "冻结 3D Transformer\n[B,3,1369,2048]", C.softBlue, C.blue],
    ["MTA pooling", "降维512 + 37²→32²\n[B,3,1024,512]", C.softBlue, C.blue],
    ["TGE + Q_GD", "3 blocks 时空注意力\n1024 query 融合", C.softTeal, C.teal],
  ];
  n1.forEach((n,i)=>{
    const x = 0.6 + i*3.13;
    card(s, x, 1.62, 2.85, 1.5, n[2], n[3]);
    s.addText(n[0], { x: x+0.18, y: 1.78, w: 2.5, h: 0.38, fontFace: F.h, fontSize: 14, color: n[3], bold: true, margin: 0 });
    s.addText(n[1], { x: x+0.18, y: 2.2, w: 2.5, h: 0.8, fontFace: F.b, fontSize: 11, color: C.sub, margin: 0 });
    if(i<3) arrow(s, x+2.88, 2.37, x+3.1, 2.37, C.muted, 1.5);
  });
  // center bridge
  card(s, 4.4, 3.35, 4.5, 0.82, C.navy, C.navy);
  s.addText("Z_GD prefix  [B,1024,2048]", { x: 4.6, y: 3.42, w: 4.1, h: 0.4, fontFace: F.h, fontSize: 16, color: "FFFFFF", bold: true, align:"center", margin: 0 });
  s.addText("拼进 VLM prefix（图像+语言+Z_GD）", { x: 4.6, y: 3.82, w: 4.1, h: 0.3, fontFace: F.b, fontSize: 10.5, color: "B9C6FF", align:"center", margin: 0 });
  // TGE (row1 last box, center x≈11.4) -> Z_GD bridge (right edge x=8.9)
  arrow(s, 11.4, 3.15, 8.95, 3.65, C.blue, 2);
  // Z_GD bridge -> shared backbone (row2 first box, center x≈2.0)
  arrow(s, 5.0, 4.2, 2.2, 4.65, C.blue, 2);
  // row 2: decoders + supervision
  const n2 = [
    ["共享 backbone", "32²→256² 特征 F_G\n[B,128,256,256]", C.softBlue, C.blue],
    ["静态头 → G_t", "当前 65536 高斯\n渲染 / 深度监督", C.softTeal, C.teal],
    ["动态头 → Ĝ_Δ", "只预测中心位移\nhorizon t+1..5", C.softCoral, C.coral],
    ["3D 监督", "render + depth\n+ 伪 3D flow", C.softAmber, C.amber],
  ];
  n2.forEach((n,i)=>{
    const x = 0.6 + i*3.13;
    card(s, x, 4.68, 2.85, 1.5, n[2], n[3]);
    s.addText(n[0], { x: x+0.18, y: 4.84, w: 2.5, h: 0.38, fontFace: F.h, fontSize: 14, color: n[3], bold: true, margin: 0 });
    s.addText(n[1], { x: x+0.18, y: 5.26, w: 2.5, h: 0.8, fontFace: F.b, fontSize: 11, color: C.sub, margin: 0 });
    if(i<3) arrow(s, x+2.88, 5.43, x+3.1, 5.43, C.muted, 1.5);
  });
  s.addText("训练：上面两排全跑（含 4 个辅助 loss）      推理：只留 Z_GD → VLA denoise 出动作，下面一排 + VGGT/TGE 全丢弃", { x: 0.6, y: 6.42, w: 12.1, h: 0.42, fontFace: F.b, fontSize: 11.5, color: C.sub, margin: 0 });
  footer(s);
}

// ================= Slide 5: Q_GD + TGE =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "GAUSSIANDREAM · 核心机制 ①", "可学习 Query 与 TGE：3D 表征怎么造出来", 5);
  sectionTag(s, 0.6, 1.45, 1, "GaussianDream Query = 一组「带座位号的问题卡」", C.blue);
  card(s, 0.6, 2.0, 5.9, 2.0, C.paper, C.line);
  s.addText([
    { text: "Q_GD：[1, 1024, 2048] 的 nn.Parameter，随机初始化、训练中学", options: { bullet:true, breakLine:true, fontSize:12.5, color:C.ink } },
    { text: "1024 = 32×32：每张卡对应场景网格一个位置（+ 空间位置编码当座位号）", options: { bullet:true, breakLine:true, fontSize:12.5, color:C.ink } },
    { text: "作用：逼 VLM「在每个格子回答：现在有什么 + 接下来怎么动」", options: { bullet:true, fontSize:12.5, color:C.blue, bold:true } },
  ], { x: 0.85, y: 2.18, w: 5.4, h: 1.7, fontFace: F.b, margin: 0 });
  sectionTag(s, 6.8, 1.45, 2, "TGE = 让问题卡读懂空间与运动", C.teal);
  card(s, 6.8, 2.0, 5.9, 2.0, C.paper, C.line);
  s.addText([
    { text: "3 个 block（对应 VGGT 层 11/17/23），8 heads", options: { bullet:true, breakLine:true, fontSize:12.5, color:C.ink } },
    { text: "每 block：query 与 VGGT patch 在 token 维拼接 → 注意力 → 切回", options: { bullet:true, breakLine:true, fontSize:12.5, color:C.ink } },
    { text: "两步交替：帧内 1024 格互看（空间）+ 同格跨 3 帧对比（时间）", options: { bullet:true, fontSize:12.5, color:C.teal, bold:true } },
  ], { x: 7.05, y: 2.18, w: 5.4, h: 1.7, fontFace: F.b, margin: 0 });
  // dimension flow strip
  card(s, 0.6, 4.35, 12.1, 1.25, C.navy, C.navy);
  s.addText("维度链", { x: 0.85, y: 4.5, w: 1.3, h: 0.35, fontFace: F.b, fontSize: 11, color: C.teal, bold: true, margin: 0 });
  s.addText("[B,3,1024,512]  +  三层 MTA [B,3,1024,512]   →   TGE   →   取当前帧 [B,1024,512]   →   Linear 512→2048   →   Z_GD [B,1024,2048]",
    { x: 0.85, y: 4.85, w: 11.6, h: 0.55, fontFace: F.b, fontSize: 13, color: "FFFFFF", align:"center", margin: 0 });
  s.addText("为什么 1024/512？32² 与 query 网格对齐；512 是 TGE 的工作维度，降维省算力。", { x: 0.85, y: 5.78, w: 12, h: 0.35, fontFace: F.b, fontSize: 11.5, color: C.sub, margin: 0 });
  card(s, 0.6, 6.25, 12.1, 0.62, C.softAmber, C.amber);
  s.addText("论文原稿写「12 blocks」是通用描述；发布代码实际是 3 blocks（len(11,17,23)）—— 已在架构图标注修正。", { x: 0.85, y: 6.35, w: 11.6, h: 0.42, fontFace: F.b, fontSize: 11.5, color: C.ink, valign:"middle", margin: 0 });
  footer(s);
}

// ================= Slide 6: decoders + supervision =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "GAUSSIANDREAM · 核心机制 ②", "双头解码 + 训练期密集监督", 6);
  // three columns
  const cols = [
    { x:0.6, n:"静态头 → G_t", c:C.blue, f:C.softBlue, lines:[
      "输入 F_G + 当前 RGB（颜色）",
      "预测 depth/rot/scale/opacity/SH",
      "depth 反投影 → 65536 个高斯中心",
      "渲染↔当前帧 RGB/深度"] },
    { x:4.67, n:"动态头 → Ĝ_Δ", c:C.teal, f:C.softTeal, lines:[
      "输入 F_G + 静态模板（detach）",
      "horizon embedding 告诉「第几步」",
      "只预测中心位移 ν，复用模板属性",
      "t+1..t+5 各一个未来高斯集"] },
    { x:8.74, n:"监督信号（训练期）", c:C.coral, f:C.softCoral, lines:[
      "render loss：SSIM+L1+LPIPS",
      "depth loss：L1（当前+未来）",
      "flow loss：位移 vs 伪 3D flow ×15",
      "256² 每像素一个高斯"] },
  ];
  cols.forEach(col=>{
    card(s, col.x, 1.5, 3.9, 3.05, col.f, col.c);
    s.addText(col.n, { x: col.x+0.2, y: 1.68, w: 3.5, h: 0.42, fontFace: F.h, fontSize: 16, color: col.c, bold: true, margin: 0 });
    s.addText(col.lines.map((t,i)=>({text:t, options:{bullet:true, breakLine:i<3, fontSize:11.5, color:C.ink}})), { x: col.x+0.22, y: 2.2, w: 3.5, h: 2.2, fontFace: F.b, margin: 0 });
  });
  // why pseudo + why discard
  card(s, 0.6, 4.8, 5.95, 1.5, C.paper, C.line);
  s.addText("「伪」3D / 伪深度是什么？", { x: 0.85, y: 4.96, w: 5.4, h: 0.35, fontFace: F.h, fontSize: 14, color: C.amber, bold: true, margin: 0 });
  s.addText("不是传感器真测的：深度来自数据集/仿真渲染，3D flow 由相邻帧 RGB+深度离线光流反投影算出。它们只是训练标签，不是模型输出。", { x: 0.85, y: 5.36, w: 5.4, h: 0.85, fontFace: F.b, fontSize: 11.5, color: C.sub, margin: 0 });
  card(s, 6.75, 4.8, 5.95, 1.5, C.paper, C.line);
  s.addText("为什么推理要丢弃这些头？", { x: 7.0, y: 4.96, w: 5.4, h: 0.35, fontFace: F.h, fontSize: 14, color: C.coral, bold: true, margin: 0 });
  s.addText("① 未来帧/深度/flow 推理时根本不存在；② 知识已蒸进 prefix；③ 渲染/解码很慢，丢了才快。这是「训练重、推理轻」的非对称精髓。", { x: 7.0, y: 5.36, w: 5.4, h: 0.85, fontFace: F.b, fontSize: 11.5, color: C.sub, margin: 0 });
  footer(s);
}

// ================= Slide 7: transfer to LingBot =================
{
  const s = pres.addSlide(); bg(s);
  header(s, "迁移与基线", "复用到 LingBot-VLA 2.0 的抓手", 7);
  s.addText("结构映射（GaussianDream → LingBot）", { x: 0.6, y: 1.45, w: 6, h: 0.4, fontFace: F.h, fontSize: 15, color: C.ink, bold: true, margin: 0 });
  const map = [
    ["Q_GD 可学习 query", "E 库任务 token [256,2560]→8 个"],
    ["VGGT / MTA 几何特征", "LingBot-Depth / DINO-Video teacher"],
    ["Z_GD prefix", "H_cur / H_fut（任务 token 过 VLM 后的 hidden）"],
    ["静态/动态高斯头 + 渲染", "LingBot 无，可新增的训练期辅助头"],
  ];
  map.forEach((r,i)=>{
    const y = 1.92 + i*0.62;
    card(s, 0.6, y, 6.05, 0.55, i%2?"FFFFFF":C.softBlue, C.line);
    s.addText(r[0], { x: 0.78, y: y+0.07, w: 2.55, h: 0.4, fontFace: F.b, fontSize: 11.5, color: C.blue, bold: true, valign:"middle", margin: 0 });
    s.addText("→", { x: 3.35, y: y+0.07, w: 0.35, h: 0.4, fontFace: F.b, fontSize: 14, color: C.muted, align:"center", valign:"middle", margin: 0 });
    s.addText(r[1], { x: 3.75, y: y+0.07, w: 2.75, h: 0.4, fontFace: F.b, fontSize: 11, color: C.ink, valign:"middle", margin: 0 });
  });
  // baseline card
  card(s, 6.95, 1.45, 5.75, 3.35, C.navy, C.navy);
  s.addText("强基线 · RoboTwin 2.0 成功率", { x: 7.2, y: 1.65, w: 5.2, h: 0.42, fontFace: F.h, fontSize: 15, color: C.teal, bold: true, margin: 0 });
  const tbl = [
    ["", "Clean", "Randomized"],
    ["π0.5", "82.74%", "76.76%"],
    ["LingBot 1.0", "88.56%", "86.68%"],
    ["LingBot 2.0", "93.52%", "92.80%"],
  ];
  s.addTable(tbl, { x: 7.15, y: 2.2, w: 5.3, h: 2.1,
    colW:[2.1,1.6,1.6], border:{pt:0.5,color:"3A4678"},
    fill:{color:"182248"}, color:"FFFFFF", fontFace:F.b, fontSize:12,
    align:"center", valign:"middle" });
  s.addText("2.0 比 π0.5：+10.78 / +16.04 点。天花板高，涨点要谨慎设计消融。", { x: 7.2, y: 4.35, w: 5.2, h: 0.35, fontFace: F.b, fontSize: 10.5, color: "B9C6FF", margin: 0 });
  // experiment idea
  card(s, 0.6, 4.75, 12.1, 1.7, C.softTeal, C.teal);
  s.addText("实验设计草案", { x: 0.85, y: 4.92, w: 3, h: 0.38, fontFace: F.h, fontSize: 15, color: C.teal, bold: true, margin: 0 });
  s.addText([
    { text: "在 LingBot 的 H_fut 后接 GaussianDream 式静态/动态头（训练期用），用 LingBot-Depth 当几何监督、可微渲染当外观监督", options: { bullet:true, breakLine:true, fontSize:12, color:C.ink } },
    { text: "基线：官方 lingbot-vla-v2-6b-robotwin 权重（Muon，Clean 93.52 / Randomized 92.80），保持相同训练设置", options: { bullet:true, breakLine:true, fontSize:12, color:C.ink } },
    { text: "创新点：训练期 3DGS 监督 + 推理零开销；与 GaussianDream 不同——它在 RoboTwin 上从未被评测过", options: { bullet:true, fontSize:12, color:C.teal, bold:true } },
  ], { x: 0.85, y: 5.32, w: 11.6, h: 1.05, fontFace: F.b, margin: 0 });
  footer(s);
}

// ================= Slides 8-11: placeholders =================
const placeholders = [
  { num:8, title:"VistaVLA（NTU）", tag:"3D Gaussian grounded VLA", color:C.blue, soft:C.softBlue,
    points:["两阶段：3D 高斯语义认知图 → Merge-then-Query 压缩 token", "SigLIP2 + DINOv2 特征注入可学习高斯原语", "真机 7 任务 +22.8 点；OOD +30%（VLA-Adapter 基线）"] },
  { num:9, title:"Scene-Scale Aerial Manipulation（NTU）", tag:"Whole-body VLA → 场景级空中操作", color:C.teal, soft:C.softTeal,
    points:["合成数据引擎 + MPAR 解决异步 action chunk 与实测进度错位", "关系式 Scene Graph 做跨任务/跨场地组合", "关注：延迟对齐、跨本体泛化"] },
  { num:10, title:"GSP-3D", tag:"3DGS + diffusion policy + world model", color:C.coral, soft:C.softCoral,
    points:["GGR 单帧 RGB-D 回归高斯 → 3DGS 条件扩散策略", "Transformer world model 预测未来高斯，预测误差当辅助 loss", "RoboTwin 2.0 双臂任务（与 LingBot 评测集重叠，可作对比）"] },
  { num:11, title:"PEAR（MIT HAN）", tag:"RL 后训练框架 · GRPO", color:C.amber, soft:C.softAmber,
    points:["27B 推理模型，零真机示范，纯仿真 RL 学会开真机", "GRPO + DAPO 组过滤 + score centering；reward = 仿真器成败", "局限：专用 kernel 仅支持 Hopper/Blackwell；思路可借鉴、规模需降级"] },
];
placeholders.forEach(p=>{
  const s = pres.addSlide(); bg(s);
  header(s, "TO BE FILLED", p.title, p.num);
  pill(s, 0.6, 1.45, 4.6, 0.4, p.tag, p.color, "FFFFFF", 12);
  // placeholder watermark
  s.addText("待补充", { x: 9.6, y: 1.35, w: 3.1, h: 0.6, fontFace: F.h, fontSize: 26, color: C.line, bold: true, align:"right", margin: 0 });
  const blocks = [
    ["核心方法", "（待补充：方法概览、与 3D 表征的关系）"],
    ["3D 表征 / 架构", "（待补充：怎么建 3D 表征、怎么进 VLA）"],
    ["实验与复现", "（待补充：benchmark、代码、可复现性）"],
  ];
  blocks.forEach((b,i)=>{
    const y = 2.1 + i*1.45;
    card(s, 0.6, y, 12.1, 1.22, C.paper, p.color);
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 0.09, h: 1.22, fill: { color: p.color } });
    s.addText(b[0], { x: 0.9, y: y+0.16, w: 3.0, h: 0.4, fontFace: F.h, fontSize: 15, color: p.color, bold: true, margin: 0 });
    s.addText(b[1], { x: 0.9, y: y+0.6, w: 11.3, h: 0.45, fontFace: F.b, fontSize: 12, color: C.muted, margin: 0 });
  });
  // hints
  s.addText("已知要点（先记这里，后续展开）：", { x: 0.65, y: 6.35, w: 4, h: 0.3, fontFace: F.b, fontSize: 10.5, color: C.sub, margin: 0 });
  s.addText(p.points.join("   ·   "), { x: 0.65, y: 6.62, w: 12, h: 0.35, fontFace: F.b, fontSize: 10.5, color: C.muted, margin: 0 });
  footer(s, p.title + " · 占位页");
});

// ================= Slide 12: next steps =================
{
  const s = pres.addSlide(); bg(s, C.navy);
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.16, h: H, fill: { color: C.teal } });
  const dots = [[11.2,1.2,0.09,C.blue],[12.0,1.7,0.12,C.teal],[11.6,2.6,0.07,C.coral],[12.5,2.9,0.1,C.amber],[10.9,3.3,0.06,C.blue]];
  dots.forEach(([x,y,d,c])=>s.addShape(pres.shapes.OVAL,{x,y,w:d,h:d,fill:{color:c}}));
  s.addText("下一步", { x: 0.8, y: 1.1, w: 8, h: 0.8, fontFace: F.h, fontSize: 42, color: "FFFFFF", bold: true, margin: 0 });
  s.addText("从调研到选题", { x: 0.82, y: 1.95, w: 8, h: 0.45, fontFace: F.b, fontSize: 18, color: C.teal, margin: 0 });
  const items = [
    ["1", "补齐其余论文精读", "按本报告骨架填充 VistaVLA / Aerial / GSP-3D / PEAR 四页"],
    ["2", "确定 3D 表征方案", "GaussianDream 式训练期插件 vs 其它 3D 注入方式，选一条主线"],
    ["3", "设计 reward / 监督", "把 3D 信息写进 reward 或辅助 loss，形成自己的创新点"],
    ["4", "对齐强基线做消融", "RoboTwin 2.0：LingBot 2.0 93.52 / 92.80 是必过的门槛"],
  ];
  items.forEach((it,i)=>{
    const y = 2.8 + i*0.92;
    s.addShape(pres.shapes.OVAL, { x: 0.85, y, w: 0.5, h: 0.5, fill: { color: C.blue } });
    s.addText(it[0], { x: 0.85, y, w: 0.5, h: 0.5, fontFace: F.h, fontSize: 16, color: "FFFFFF", bold: true, align:"center", valign:"middle", margin:0 });
    s.addText(it[1], { x: 1.55, y: y-0.02, w: 4.2, h: 0.5, fontFace: F.h, fontSize: 16, color: "FFFFFF", bold: true, valign:"middle", margin:0 });
    s.addText(it[2], { x: 5.8, y: y-0.02, w: 6.6, h: 0.54, fontFace: F.b, fontSize: 12, color: "B9C6FF", valign:"middle", margin:0 });
  });
  s.addText("谢谢 · Q&A", { x: 0.82, y: 6.65, w: 6, h: 0.5, fontFace: F.h, fontSize: 20, color: C.teal, bold: true, margin: 0 });
}

pres.writeFile({ fileName: "c:/Users/Easy/Desktop/LingBot/VLA论文调研报告.pptx" })
  .then(() => console.log("OK: VLA论文调研报告.pptx"))
  .catch(e => { console.error(e); process.exit(1); });
