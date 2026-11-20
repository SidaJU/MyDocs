# ⚠️ 警告：3D 分支必须用 VGGT 特征，不能用 img_emb

> 给继续写代码的 GPT：当前实现有一个关键偏差，必须修正。这不是可选优化，是方案正确性的要求。

## 问题

当前 `modeling_lingbot_vla_v2.py:633`：

```python
gaussian_3d_tokens = self.gaussian_3d_adapter(img_emb).to(dtype=embed_dtype)
```

`img_emb` 是 **LingBot 自己的 Qwen3-VL 视觉塔（2D vision encoder）** 的输出 `[B, 198, 2560]`。它是 **2D 视觉特征**，不是 VGGT 特征。用 `img_emb` 相当于"拿 2D 图片特征假装是 3D 表征"——这违背整个方案的目标（GaussianDream 式的 3D 表征流入 VLM），论文里也无法称为 3D 表征。

## 为什么不能接受

1. **目标不符**：我们要复现 GaussianDream 的核心——VGGT aggregator 从多视角图里提取带 3D 几何先验的 token，再注入 VLM。`img_emb` 没有任何 3D 几何编码。
2. **论文不好讲**：reviewer 会问"你的 3D 表征从哪来"，回答"Qwen 视觉塔的 2D 特征"——直接 rejected。
3. **效果打折**：render loss 逼 adapter 从 2D 特征硬猜 3D，没有 VGGT 预训练的几何先验，收敛差、上限低。

## 必须改成

**VGGT-1B 权重是 Meta 官方公开的**：`facebook/VGGT-1B` 的 `model.pt`（约 5GB），公开直下，没有 gated 限制。GaussianDream 自带源码 `third_party/AD-FFgsStudio/models/vggt3dgs_model.py` 里就是这么加载的（`VGGT_URL = "https://huggingface.co/facebook/VGGT-1B/resolve/main/model.pt"`）。

正确的数据流：

```
三路 RGB (camera_top / wrist_left / wrist_right)
   → VGGT aggregator（frozen，facebook/VGGT-1B 权重）
       输入组织：GaussianDream 原版是 3 帧时序；我们第一版用三视角当"多视图"输入，
                 需显式说明"三相机 ≠ 三帧时序"，用 VGGT 的多视图能力，不要伪装成时间帧
   → 多视角 3D 特征 [B, V, N_vggt, D_vggt]
   → Gaussian3DPrefixAdapter(view_features)   # 该 adapter 已支持 [B,V,N,D] 输入
   → 256 个 3D token [B,256,2560] → VLM prefix
```

## 具体修改点（改完继续）

1. **初始化**：在 `FlowMatchingV2.__init__` 里（`gaussian_3d_adapter` 创建附近，:505-514），当 `enable_gaussian_3d=True` 时，加载 VGGT aggregator：
   - 从 `facebook/VGGT-1B` 下载/加载权重（用 `VGGT.from_pretrained("facebook/VGGT-1B")` 或 GaussianDream 的 `VGGT3DGSModel` 加载方式）
   - 冻结主干（`.requires_grad_(False)`），只取 `.aggregator`
   - 记录 `self.gaussian_vggt_feature_dim`（VGGT aggregator 输出维度）

2. **adapter 的 feature_dim**：`Gaussian3DPrefixAdapter(feature_dim=...)` 当前传的是 `vlm_hidden_size`（2560），要改成 VGGT aggregator 的输出维度。

3. **forward 里替换输入**（:630-633）：
   ```python
   # 删除：gaussian_3d_tokens = self.gaussian_3d_adapter(img_emb)
   # 改成：
   vggt_features = self.gaussian_vggt_aggregator(images_normalized_for_vggt)  # [B,V,N,D]
   gaussian_3d_tokens = self.gaussian_3d_adapter(vggt_features)
   ```
   - 输入图像要做 VGGT 要求的 resize（518×518）和归一化，和 LingBot 的 224² 预处理分开走
   - VGGT 用 bfloat16 + `torch.no_grad()`/frozen

4. **配置**：在 config 里加 VGGT 权重路径（如 `gaussian_vggt_checkpoint: facebook/VGGT-1B`），默认从 hub 下载。

5. **推理保留**：VGGT aggregator 在推理时**不能丢**——要在线从三路 RGB 生成 3D prefix（和 GaussianDream 推理仍跑 VGGT 一致）。只丢 Gaussian Decoder / Rasterizer / render loss。

## 验证清单（改完检查）
- [ ] `enable_gaussian_3d=True` 时，VGGT 权重能加载（本地有缓存或从 hub 下）
- [ ] VGGT 输出形状正确，`Gaussian3DPrefixAdapter` 的 `feature_dim` 和它对上
- [ ] `gaussian_3d_adapter` 的输入是 VGGT 特征，不是 img_emb（代码里搜不到 `adapter(img_emb)`）
- [ ] VGGT 主干 `requires_grad=False`
- [ ] 推理路径仍走 VGGT（只丢 Decoder/Renderer/loss）
- [ ] 前向不 OOM（VGGT 比 img_emb 重，40GB 卡上注意 batch）

## 一句话
**img_emb 是临时简化，不是最终方案。必须换成 VGGT aggregator 的 3D 特征，否则整个"3D 表征融入 VLA"的论文不成立。**
