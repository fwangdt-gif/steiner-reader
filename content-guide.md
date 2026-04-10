# 内容使用说明

本项目的所有书籍和章节数据存放在一个文件中：

```
lib/books.json
```

只需编辑这个文件，保存后页面自动更新，无需修改任何代码。

---

## 文件结构概览

`books.json` 是一个数组，每个元素是一本书，每本书包含若干章节：

```
[ 书A, 书B, 书C, ... ]
       ↓
  每本书包含 chapters: [ 章节1, 章节2, ... ]
                  ↓
            每个章节包含 blocks: [ 段落1, 段落2, ... ]
```

---

## 一本书的完整字段

```json
{
  "id": "my-book",
  "titleOriginal": "Originaltitel",
  "titleZh": "中文书名",
  "author": "Rudolf Steiner",
  "description": "这本书的简介，显示在书库和书目页。",
  "coverColor": "#4a6fa5",
  "publishedYear": 1910,
  "chapters": []
}
```

| 字段 | 说明 |
|------|------|
| `id` | 书的唯一标识，用于 URL。只能用英文小写字母和 `-`，例如 `my-book` |
| `titleOriginal` | 原文书名（德文） |
| `titleZh` | 中文书名 |
| `author` | 作者名 |
| `description` | 简介，显示在书库页和书目页 |
| `coverColor` | 书脊颜色，填写十六进制色值，例如 `#4a6fa5` |
| `publishedYear` | 出版年份，填数字 |
| `chapters` | 章节列表（见下方） |

---

## 一个章节的完整字段

```json
{
  "id": "my-book-ch1",
  "bookId": "my-book",
  "title": "Erstes Kapitel",
  "titleZh": "第一章标题",
  "orderIndex": 1,
  "status": "published",
  "blocks": []
}
```

| 字段 | 说明 |
|------|------|
| `id` | 章节唯一标识，建议用 `书id-ch序号`，例如 `my-book-ch1` |
| `bookId` | 必须与所属书的 `id` 完全一致 |
| `title` | 章节原文标题（德文） |
| `titleZh` | 章节中文标题 |
| `orderIndex` | 章节排列顺序，填数字，从 1 开始 |
| `status` | `"published"` 表示已发布可阅读，`"draft"` 表示草稿（目录中显示为灰色，不可点击） |
| `blocks` | 段落列表（见下方） |

---

## 一个段落（block）的完整字段

```json
{
  "id": "my-book-ch1-b0",
  "blockIndex": 0,
  "blockType": "paragraph",
  "originalText": "德文原文内容。",
  "translationText": "中文译文内容。"
}
```

| 字段 | 说明 |
|------|------|
| `id` | 段落唯一标识，建议用 `章节id-b序号`，例如 `my-book-ch1-b0` |
| `blockIndex` | 段落在章节中的顺序，从 0 开始 |
| `blockType` | 段落类型，见下方说明 |
| `originalText` | 德文原文 |
| `translationText` | 中文译文（页面显示此内容） |
| `scanPageRef` | 可选，对应原书页码，填数字即可 |

**blockType 类型说明：**

| 类型 | 显示效果 |
|------|----------|
| `"heading"` | 大标题，加粗加大 |
| `"subheading"` | 小标题，略小于标题 |
| `"paragraph"` | 普通正文段落 |
| `"quote"` | 引用，带左侧竖线和背景色 |

---

## 如何新增一本书（完整示例）

打开 `lib/books.json`，在文件末尾的 `]` 前，加入以下内容：

```json
  ,{
    "id": "occult-science",
    "titleOriginal": "Die Geheimwissenschaft im Umriss",
    "titleZh": "神秘学概论",
    "author": "Rudolf Steiner",
    "description": "本书概述了精神科学的基本内容，包括人的本性、宇宙演化和精神修炼之路。",
    "coverColor": "#8a5a44",
    "publishedYear": 1910,
    "chapters": [
      {
        "id": "os-ch1",
        "bookId": "occult-science",
        "title": "Der Charakter der Geheimwissenschaft",
        "titleZh": "神秘学的特点",
        "orderIndex": 1,
        "status": "published",
        "blocks": [
          {
            "id": "os-ch1-b0",
            "blockIndex": 0,
            "blockType": "heading",
            "originalText": "Der Charakter der Geheimwissenschaft",
            "translationText": "神秘学的特点"
          },
          {
            "id": "os-ch1-b1",
            "blockIndex": 1,
            "blockType": "paragraph",
            "originalText": "Wer das vorliegende Buch lesen will, muss sich gefasst machen auf mancherlei Schwierigkeiten.",
            "translationText": "凡想阅读本书的人，必须做好迎接种种困难的准备。",
            "scanPageRef": 1
          }
        ]
      }
    ]
  }
```

保存文件后，可通过以下路径访问：

- 书目页：`/books/occult-science`
- 第一章：`/books/occult-science/chapters/os-ch1`

---

## 如何在现有书中新增章节

找到对应书的 `chapters` 数组，在最后一个章节的 `}` 后面加逗号，再追加新章节：

```json
"chapters": [
  { ...已有章节... },
  {
    "id": "theosophy-ch4",
    "bookId": "theosophy",
    "title": "Viertes Kapitel",
    "titleZh": "第四章",
    "orderIndex": 4,
    "status": "draft",
    "blocks": []
  }
]
```

`"blocks": []` 表示内容待填，页面会显示"本章内容尚未整理完成"。

---

## 常见错误

**1. id 重复**

每本书的 `id`、每个章节的 `id`、每个 block 的 `id` 都必须全局唯一。
重复会导致部分内容无法正常显示或跳转错误。

错误示例：
```json
{ "id": "theosophy-ch1", ... }  ← 已存在
{ "id": "theosophy-ch1", ... }  ← 重复，会出错
```

**2. bookId 与书的 id 不一致**

章节的 `bookId` 必须与所属书的 `id` 完全一致（包括大小写）。

错误示例：
```json
{ "id": "my-book", ... }              ← 书的 id
{ "bookId": "My-Book", ... }          ← 大小写不同，会出错
```

**3. JSON 格式错误**

JSON 对格式要求严格，最常见的错误：

- 最后一个元素后面多了逗号：
  ```json
  { "a": 1 },   ← 多余的逗号，会出错
  ]
  ```
- 中文引号替代了英文引号：
  ```json
  "titleZh": "神智学"   ← 中文引号，会出错
  "titleZh": "神智学"   ← 正确，英文引号
  ```

**4. status 拼写错误**

只接受 `"published"` 或 `"draft"`，其他值会导致章节无法正常显示。

**5. id 包含空格或特殊字符**

`id` 只能使用英文小写字母、数字和 `-`，不能有空格、中文或其他符号。

```json
"id": "my book"    ← 有空格，会导致 URL 错误
"id": "my-book"    ← 正确
```

---

## 快速检查 JSON 是否合法

将 `lib/books.json` 的内容粘贴到 [jsonlint.com](https://jsonlint.com) 即可检验格式是否正确。
