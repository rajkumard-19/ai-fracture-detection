# RayVive FPGA — X-Ray Image Preprocessing Pipeline

## Architecture

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌────────────┐
│   Gaussian   │    │   Contrast    │    │    Sobel      │    │ Threshold  │
│   Filter     │ ──►│  Enhancement  │ ──►│   Edge Det.  │ ──►│ (Binary)   │
│   (3×3)      │    │  (Stretch)    │    │   (3×3)      │    │            │
└──────────────┘    └───────────────┘    └──────────────┘    └────────────┘
     │                    │                    │                   │
     ▼                    ▼                    ▼                   ▼
  Denoised           Enhanced              Edge Map           Bone Mask
  Image              Contrast              (Boundaries)       (Segmented)
```

## Modules

| Module | File | Function |
|--------|------|----------|
| `gaussian_filter` | `src/gaussian_filter.v` | 3×3 Gaussian blur for noise reduction |
| `contrast_enhance` | `src/contrast_enhance.v` | Linear contrast stretching (0-255) |
| `sobel_edge` | `src/sobel_edge.v` | Sobel gradient edge detection |
| `threshold` | `src/threshold.v` | Binary/Band thresholding |
| `preprocessing_top` | `src/preprocessing_top.v` | Top-level pipeline with output MUX |
| `tb_preprocessing` | `tb/tb_preprocessing.v` | Testbench with synthetic X-ray |

## How to Simulate

### Using Icarus Verilog (Free, Open Source)

```bash
# Install (macOS)
brew install icarus-verilog gtkwave

# Compile
cd fpga
iverilog -o rayvive_sim tb/tb_preprocessing.v src/preprocessing_top.v \
    src/gaussian_filter.v src/sobel_edge.v src/contrast_enhance.v src/threshold.v

# Run simulation
vvp rayvive_sim

# View waveforms
gtkwave rayvive_fpga.vcd
```

### Using Xilinx Vivado

1. Create new project → RTL Project
2. Add all `src/*.v` files as Design Sources
3. Add `tb/tb_preprocessing.v` as Simulation Source
4. Run Simulation → Behavioral Simulation
5. View waveforms in built-in viewer

### Using ModelSim

```bash
vlib work
vlog src/*.v tb/*.v
vsim -c tb_preprocessing -do "run -all"
```

## Output Selection

The `output_sel` input selects which pipeline stage to observe:

| Value | Output |
|-------|--------|
| `00` | Gaussian filtered (denoised) |
| `01` | Contrast enhanced |
| `10` | Sobel edge magnitude |
| `11` | Thresholded binary mask |

## Target FPGA Boards

| Board | FPGA | Suitable? |
|-------|------|-----------|
| Basys 3 | Xilinx Artix-7 | ✅ Ideal for labs |
| Nexys A7 | Xilinx Artix-7 | ✅ More I/O |
| ZedBoard | Xilinx Zynq-7000 | ✅ Best (ARM + FPGA) |
| DE10-Nano | Intel Cyclone V | ✅ Budget option |

## Resource Estimates (Artix-7)

| Resource | Used (Est.) | Available | Utilization |
|----------|-------------|-----------|-------------|
| LUTs | ~2,500 | 20,800 | ~12% |
| Flip-Flops | ~1,800 | 41,600 | ~4% |
| Block RAM | 4 | 50 | 8% |
| DSP Slices | 2 | 90 | 2% |

## Integration with RayVive Cloud

```
FPGA Board                          Cloud (Vercel)
┌─────────────┐    UART/WiFi    ┌─────────────────┐
│ Preprocess  │ ──────────────► │ Gemini AI Model  │
│ Pipeline    │                 │ Fracture Analysis│
│             │ ◄────────────── │ Report + Plan    │
└─────────────┘    JSON Result  └─────────────────┘
```

The FPGA preprocesses the X-ray image in real-time, then sends 
the enhanced image to the RayVive cloud server for AI-based 
fracture classification and medical report generation.
