// ============================================================
// RayVive FPGA — Top-Level Preprocessing Pipeline
// Connects: Gaussian → Contrast Enhancement → Sobel Edge → Threshold
// 
// Pipeline Architecture:
//   Input Image → [Gaussian Filter] → [Contrast Enhance] → 
//                 [Sobel Edge Detection] → [Threshold] → Output
//
// All modules operate on streaming 8-bit grayscale pixels
// with valid_in/valid_out handshaking
// ============================================================

module preprocessing_top (
    input  wire        clk,           // System clock (50MHz typical)
    input  wire        rst_n,         // Active-low reset
    input  wire        pixel_valid,   // Input pixel is valid
    input  wire [7:0]  pixel_data,    // 8-bit grayscale input pixel
    input  wire [7:0]  thresh_val,    // Threshold value (configurable)
    input  wire [1:0]  output_sel,    // 00=gaussian, 01=contrast, 10=edge, 11=threshold
    output wire        out_valid,     // Output pixel is valid
    output reg  [7:0]  out_pixel,     // Processed output pixel
    output wire [7:0]  edge_map       // Binary edge detection output
);

    parameter IMG_WIDTH = 256;

    // === Internal wires ===
    
    // Gaussian filter outputs
    wire       gauss_valid;
    wire [7:0] gauss_pixel;

    // Contrast enhance outputs
    wire       contrast_valid;
    wire [7:0] contrast_pixel;
    wire [7:0] contrast_min, contrast_max;

    // Sobel edge outputs
    wire       sobel_valid;
    wire [7:0] sobel_pixel;
    wire [7:0] sobel_binary;

    // Threshold outputs
    wire       thresh_valid;
    wire [7:0] thresh_pixel;

    // === Stage 1: Gaussian Noise Reduction ===
    gaussian_filter #(
        .IMG_WIDTH(IMG_WIDTH)
    ) u_gaussian (
        .clk       (clk),
        .rst_n     (rst_n),
        .valid_in  (pixel_valid),
        .pixel_in  (pixel_data),
        .valid_out (gauss_valid),
        .pixel_out (gauss_pixel)
    );

    // === Stage 2: Contrast Enhancement ===
    contrast_enhance u_contrast (
        .clk       (clk),
        .rst_n     (rst_n),
        .valid_in  (gauss_valid),
        .pixel_in  (gauss_pixel),
        .pass      (1'b1),              // Direct apply mode
        .valid_out (contrast_valid),
        .pixel_out (contrast_pixel),
        .min_val   (contrast_min),
        .max_val   (contrast_max)
    );

    // === Stage 3: Sobel Edge Detection ===
    sobel_edge #(
        .IMG_WIDTH(IMG_WIDTH)
    ) u_sobel (
        .clk         (clk),
        .rst_n       (rst_n),
        .valid_in    (contrast_valid),
        .pixel_in    (contrast_pixel),
        .valid_out   (sobel_valid),
        .pixel_out   (sobel_pixel),
        .edge_binary (sobel_binary)
    );

    // === Stage 4: Threshold (Bone Segmentation) ===
    threshold u_threshold (
        .clk         (clk),
        .rst_n       (rst_n),
        .valid_in    (sobel_valid),
        .pixel_in    (sobel_pixel),
        .thresh_low  (thresh_val),
        .thresh_high (8'd200),
        .mode        (2'b00),           // Binary mode
        .valid_out   (thresh_valid),
        .pixel_out   (thresh_pixel)
    );

    // === Output Multiplexer ===
    // Select which stage output to observe
    assign out_valid = (output_sel == 2'b00) ? gauss_valid    :
                       (output_sel == 2'b01) ? contrast_valid :
                       (output_sel == 2'b10) ? sobel_valid    :
                                               thresh_valid;

    assign edge_map = sobel_binary;

    always @(*) begin
        case (output_sel)
            2'b00:   out_pixel = gauss_pixel;     // View Gaussian output
            2'b01:   out_pixel = contrast_pixel;  // View Contrast output
            2'b10:   out_pixel = sobel_pixel;     // View Edge magnitude
            2'b11:   out_pixel = thresh_pixel;    // View Thresholded output
            default: out_pixel = pixel_data;
        endcase
    end

endmodule
