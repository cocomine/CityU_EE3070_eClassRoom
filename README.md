# 注意：本 repo 只用作目錄用途，實質 project 需要前往各 sub repo 查看及運行。

# CityU EE3070 eClassRoom

呢個 repository 係 EE3070 eClassRoom project 嘅總入口，用來集中整理 mobile app 同 backend server 兩個子 project。主要用途係方便瀏覽 project 結構、追蹤 submodule 來源，以及讓讀者知道應該去邊個 sub repo 查看實際程式碼。

## Project 目的

eClassRoom 目標係建立一個課堂互動平台，支援老師同學生喺課堂入面進行教材、問題同回覆相關操作。整體 project 分為前端 mobile app 同後端 server：

- Mobile app：提供學生同老師使用嘅介面，例如進入 course、掃描 QR code、查看/提交問題同處理課堂內容。
- Backend server：提供 API、資料儲存、檔案處理、問題生成及回覆批改等後端功能。

## Sub repos

實際 project 分別位於以下 sub repo：

- `CityU_EE3070_eClassRoom_app`
  - GitHub: https://github.com/cocomine/CityU_EE3070_eClassRoom_app.git
  - 內容：Expo / React Native mobile app

- `CityU_EE3070_eClassRoom_server`
  - GitHub: https://github.com/cocomine/CityU_EE3070_eClassRoom_server.git
  - 內容：TypeScript backend server

## Clone 方法

如果要一併取得 sub repo 內容，可以使用：

```bash
git clone --recurse-submodules <this-repo-url>
```

如果已經 clone 咗呢個 repo，可以再初始化 submodules：

```bash
git submodule update --init --recursive
```

## 開發位置

請到相應 sub repo 查看安裝、運行及開發指引：

- App 開發：`CityU_EE3070_eClassRoom_app/README.md`
- Server 開發：`CityU_EE3070_eClassRoom_server/README.md`

---

# Note: this repo is only used as a directory/index. Please visit each sub repo for the actual project implementation.

# CityU EE3070 eClassRoom

This repository is the main entry point for the EE3070 eClassRoom project. It is used to organize the mobile app and backend server subprojects in one place, making it easier to browse the project structure, track the submodule sources, and locate the actual implementation repositories.

## Project Purpose

eClassRoom aims to provide an interactive classroom platform for teachers and students. It supports classroom activities related to course materials, questions, replies, and learning interactions. The overall project is split into a frontend mobile app and a backend server:

- Mobile app: provides the user interface for students and teachers, including course access, QR code scanning, question viewing/submission, and classroom content handling.
- Backend server: provides APIs, data storage, file handling, question generation, reply marking, and other backend functions.

## Sub Repos

The actual project implementation is located in the following sub repos:

- `CityU_EE3070_eClassRoom_app`
  - GitHub: https://github.com/cocomine/CityU_EE3070_eClassRoom_app.git
  - Content: Expo / React Native mobile app

- `CityU_EE3070_eClassRoom_server`
  - GitHub: https://github.com/cocomine/CityU_EE3070_eClassRoom_server.git
  - Content: TypeScript backend server

## Clone Instructions

To clone this repository together with all sub repo contents, use:

```bash
git clone --recurse-submodules <this-repo-url>
```

If you have already cloned this repository, initialize the submodules with:

```bash
git submodule update --init --recursive
```

## Development Location

Please refer to the corresponding sub repo for installation, running, and development instructions:

- App development: `CityU_EE3070_eClassRoom_app/README.md`
- Server development: `CityU_EE3070_eClassRoom_server/README.md`
