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

- `CityU_EE3070_eClassRoom_Arduino`
  - GitHub: <https://github.com/Spongexing/CityU_EE3070_eClassRoom_xing>
  - Role: classroom environment sensor acquisition and preprocessing

- `CityU_EE3070_eClassRoom_ESP32`
  - GitHub: <https://github.com/ProHandsomeGod/EE3070-TGAM>
  - Role: ESP32-side biosignal acquisition and preprocessing for student status monitoring

- `CityU_EE3070_eClassRoom_PYNQ`
  - GitHub: <https://github.com/Ivanhihi/EE3070-PYNQ-Z2-part>
  - Role: packet analysis, classroom control, actuator execution, and upstream data upload

## Arduino Module

The Arduino module is the environmental sensing node for the classroom-control pipeline. It collects classroom sensor values, applies basic filtering and calibration, and forwards the processed readings to the next stage.

Main responsibilities:

- read indoor light data from the PGM5539 sensor
- read outside light data from an analog light input
- read temperature and humidity from the DHT11 sensor
- read CO2 values from the serial CO2 module
- apply temperature offset calibration and exponential smoothing
- output filtered sensor values over serial in CSV form

Current contents in `CityU_EE3070_eClassRoom_Arduino` include:

- `EE3070_Arduino.ino`
  - main Arduino sketch for classroom environment sensing

## ESP32 Module

The ESP32 module is part of the student status monitoring pipeline. It is responsible for collecting and preprocessing signals before forwarding structured data to the FPGA / PYNQ-Z2 layer.

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

## PYNQ Module

The PYNQ module is the central processing and control node between the edge devices and the cloud-facing part of the system. It receives packets from the ESP32, validates and analyzes the data, decides control strategies, drives classroom actuators, and can upload summarized results upstream.

Main responsibilities:

- read and decode serial packets from the ESP32
- validate packet structure, length, footer, and CRC
- analyze EEG and heart-rate data into attention and stress indicators
- use the PYNQ overlay when available, with software fallback when hardware features are unavailable
- control classroom outputs such as RGB lighting, fan, cooler, exhaust, and window servo
- apply smoothed strategy outputs instead of abrupt actuator changes
- upload non-raw summarized data to the VPS / server side

Current contents in `CityU_EE3070_eClassRoom_PYNQ` include:

- `EE3070 Final-2.ipynb`
  - main PYNQ notebook for packet handling, analysis, control, and upload flow
- `README.md`
  - short module-level description

## System Data Flow

The current project structure follows this high-level flow:

`Arduino sensors -> ESP32 -> FPGA / PYNQ-Z2 -> cloud server -> application`

In the environment-monitoring path, the Arduino module processes:

- light, temperature, humidity, and CO2 readings
- basic calibration and smoothing before serial output

In the student-monitoring path, the ESP32 processes:

- TGAM brainwave raw data into EEG band powers
- HW827 pulse data into heart-rate values

In the control and analysis path, the PYNQ module processes:

- incoming sensor and biosignal packets from the ESP32
- attention and stress estimation
- environment-control decisions for lighting, fan, cooler, exhaust, and window outputs
- summarized upload data for the upstream server

Those processed results are then forwarded for further analysis, storage, control execution, and display in the rest of the system.

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
- Arduino sensor node: inspect `CityU_EE3070_eClassRoom_Arduino/`
- ESP32 firmware and experiments: inspect the files under `CityU_EE3070_eClassRoom_ESP32/`
- PYNQ processing and control notebook: inspect `CityU_EE3070_eClassRoom_PYNQ/`
