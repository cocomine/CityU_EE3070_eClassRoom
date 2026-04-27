# CityU EE3070 eClassRoom

This repository is the top-level entry point for the EE3070 eClassRoom project. It keeps the project components together as Git submodules so the full system can be tracked in one place.

The overall project is a smart classroom system with three main functions:

- adaptive classroom environment control
- student status monitoring with biosignal sensing
- AI-assisted learning result testing

## Repository Structure

The actual implementation is stored in the following submodules:

- `CityU_EE3070_eClassRoom_app`
  - GitHub: <https://github.com/cocomine/CityU_EE3070_eClassRoom_app.git>
  - Role: teacher and student application interface

- `CityU_EE3070_eClassRoom_server`
  - GitHub: <https://github.com/cocomine/CityU_EE3070_eClassRoom_server.git>
  - Role: backend APIs, storage, async task processing, and AI workflow integration

- `CityU_EE3070_eClassRoom_ESP32`
  - GitHub: <https://github.com/ProHandsomeGod/EE3070-TGAM>
  - Role: ESP32-side biosignal acquisition and preprocessing for student status monitoring

## ESP32 Module

Based on the project report, the ESP32 module is part of the student status monitoring pipeline. It is responsible for collecting and preprocessing signals before forwarding structured data to the FPGA / PYNQ-Z2 layer.

Main responsibilities:

- connect to the TGAM EEG sensor over Bluetooth
- collect heart-rate data from the HW827 sensor
- optionally receive environmental data forwarded from Arduino
- convert EEG raw samples into band-power features with FFT
- estimate heart rate in BPM from filtered pulse signals
- pack the processed data and send it to the next stage

Current contents in `CityU_EE3070_eClassRoom_ESP32` include:

- `bluetooth/`
  - ESP32 Arduino sketches for TGAM, HW827, and packet transmission
- `pcpy/`
  - PC-side scripts used for TGAM reading and raw-data experiments
- `func2-v3.drawio`
  - diagram source related to Function 2

## System Data Flow

The current project structure follows this high-level flow:

`Arduino sensors -> ESP32 -> FPGA / PYNQ-Z2 -> cloud server -> application`

In the student-monitoring path, the ESP32 processes:

- TGAM brainwave raw data into EEG band powers
- HW827 pulse data into heart-rate values

Those processed results are then forwarded for further analysis and display in the rest of the system.

## Clone Instructions

To clone this repository together with all submodules:

```bash
git clone --recurse-submodules <this-repo-url>
```

If the repository is already cloned, initialize and update submodules with:

```bash
git submodule update --init --recursive
```

## Development Notes

This repository is mainly an index and container for the subprojects. Setup, build, and run instructions should be read from each submodule directly:

- app: `CityU_EE3070_eClassRoom_app/README.md`
- server: `CityU_EE3070_eClassRoom_server/README.md`
- ESP32 firmware and experiments: inspect the files under `CityU_EE3070_eClassRoom_ESP32/`
