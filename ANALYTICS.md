# Google Analytics 4 埋点合同

数据流：GAIDN 经营沙盘 · GitHub Pages。衡量 ID：`G-R3SEBYCRSR`。只在正式 HTTPS 地址启用；`ga_debug=1` 标记调试事件。

| 事件 | 触发点 | 用途 |
| --- | --- | --- |
| page_view | 正式页面载入一次 | 看访问规模 |
| sandbox_step_view | 实际进入开始、核对或结果步骤 | 看停在哪一步 |
| prompt_copy | 复制完成或转为手动复制 | 看是否开始外部对话准备 |
| skill_download | 请求下载内嵌 skill | 补充起步统计 |
| parameter_import | 参数真正读入或导入失败 | 看返回网页后的完成率与错误 |
| review_edit | 一份导入资料第一次修改 | 看是否需要纠正 |
| diagnosis_generate | 结果已生成或校验失败 | 看结果完成率 |
| diagnosis_edit | 从结果返回修改 | 看结果后续使用 |
| result_image_generate | PNG 实际生成成功或失败 | 看出图效果 |
| result_image_download | 点击已生成 PNG 的下载链接 | 看分享素材获取意愿 |
| parameters_download | 请求下载当前参数 | 看再次使用意愿 |
| repair_copy | 复制导入修正要求 | 看格式修复需求 |
| share | 设备原生分享完成、取消或失败 | 看支持该能力的设备分享情况 |

`input_origin` 区分 `example` 与 `user`；所有示例进入同一管道，但分析正式使用时筛选 `user`。`input_method` 区分 `paste`、`file`、`example`。`status`、`result_status`、`error_code` 为固定枚举。`review_edit` 同一份导入资料只发一次。成功导入不等于真实企业真实性已经核验。

建议先看：访问 → 成功复制提示词/下载 skill → 自有资料成功导入 → 自有资料成功生成 → PNG 下载。这是开放漏斗：可以直接导入，也可以先体验示例。用用户数比较阶段覆盖，用事件数看重复操作；不把原生分享或下载等同于已发朋友圈。

Google Analytics 默认报告仍会采集标准访问标识，本站不给 Google 发送业务正文。页地址剔除查询参数及片段，referrer 只保留域名。关闭网页数据流的增强型衡量，防止自动文件/表单信息与自定义事件重复。

Google 端建议注册事件级自定义维度 `input_origin`、`input_method`、`step`、`status`、`result_status`，便于报表筛选。后台注册状态以本次部署记录为准。查看“实时”或 DebugView 验证收集；常规报表不是即时更新。

维护：修改 `app/analytics.js` 白名单或 `app/ui.js` 触发点，运行 `node --test tests/analytics.test.cjs`、`python3 publish.py`，将源码、dist、docs 一并提交发布。对规则或 UI 的新改动补适当检查。
