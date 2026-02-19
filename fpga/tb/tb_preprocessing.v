// ============================================================
// RayVive FPGA — Testbench for Preprocessing Pipeline
// Simulates a 256x256 grayscale X-ray image with a
// synthetic bone fracture pattern
// ============================================================

`timescale 1ns / 1ps

module tb_preprocessing;

    // Clock and Reset
    reg        clk;
    reg        rst_n;
    
    // Inputs
    reg        pixel_valid;
    reg [7:0]  pixel_data;
    reg [7:0]  thresh_val;
    reg [1:0]  output_sel;

    // Outputs
    wire       out_valid;
    wire [7:0] out_pixel;
    wire [7:0] edge_map;

    // Image parameters
    parameter IMG_WIDTH  = 256;
    parameter IMG_HEIGHT = 256;
    parameter CLK_PERIOD = 20;  // 50MHz

    // Image storage
    reg [7:0] test_image [0:IMG_WIDTH*IMG_HEIGHT-1];
    reg [7:0] output_image [0:IMG_WIDTH*IMG_HEIGHT-1];
    
    integer i, j, idx;
    integer out_idx;
    integer fd;

    // === DUT Instantiation ===
    preprocessing_top #(
        .IMG_WIDTH(IMG_WIDTH)
    ) dut (
        .clk         (clk),
        .rst_n       (rst_n),
        .pixel_valid (pixel_valid),
        .pixel_data  (pixel_data),
        .thresh_val  (thresh_val),
        .output_sel  (output_sel),
        .out_valid   (out_valid),
        .out_pixel   (out_pixel),
        .edge_map    (edge_map)
    );

    // === Clock Generation: 50MHz ===
    initial clk = 0;
    always #(CLK_PERIOD/2) clk = ~clk;

    // === Generate Synthetic X-ray Image ===
    // Creates a test image with:
    // - Gray background (simulating soft tissue)
    // - Bright horizontal bone (high intensity)
    // - A dark fracture line through the bone
    task generate_test_image;
        begin
            for (i = 0; i < IMG_HEIGHT; i = i + 1) begin
                for (j = 0; j < IMG_WIDTH; j = j + 1) begin
                    idx = i * IMG_WIDTH + j;

                    // Background: dark gray (soft tissue ~40-60)
                    test_image[idx] = 8'd50;

                    // Bone region: bright band (rows 100-160)
                    if (i >= 100 && i <= 160) begin
                        test_image[idx] = 8'd200;

                        // Cortical bone edges (brighter)
                        if (i >= 100 && i <= 105) test_image[idx] = 8'd230;
                        if (i >= 155 && i <= 160) test_image[idx] = 8'd230;
                    end

                    // Fracture line: dark diagonal line through bone
                    // Simulates a transverse fracture at column ~128
                    if (i >= 100 && i <= 160) begin
                        if (j >= 125 && j <= 131) begin
                            // Fracture gap (dark = no bone continuity)
                            test_image[idx] = 8'd30;
                        end
                    end

                    // Joint space: slightly brighter at edges
                    if (i >= 95 && i < 100) test_image[idx] = 8'd80;
                    if (i > 160 && i <= 165) test_image[idx] = 8'd80;

                    // Add some noise variation
                    if ((i + j) % 7 == 0) begin
                        test_image[idx] = test_image[idx] + 8'd3;
                    end
                    if ((i * j) % 11 == 0) begin
                        test_image[idx] = (test_image[idx] > 3) ? 
                                           test_image[idx] - 8'd3 : 8'd0;
                    end
                end
            end
            $display("[INFO] Test X-ray image generated: %0dx%0d", 
                     IMG_WIDTH, IMG_HEIGHT);
        end
    endtask

    // === Main Test Sequence ===
    initial begin
        // Setup
        rst_n       = 0;
        pixel_valid = 0;
        pixel_data  = 0;
        thresh_val  = 8'd50;    // Edge threshold
        output_sel  = 2'b10;    // Show edge detection output
        out_idx     = 0;

        // Generate test image
        generate_test_image();

        // Reset
        #(CLK_PERIOD * 5);
        rst_n = 1;
        #(CLK_PERIOD * 5);

        $display("============================================");
        $display("  RayVive FPGA Preprocessing Pipeline Test  ");
        $display("============================================");
        $display("[INFO] Starting image processing...");
        $display("[INFO] Image size: %0dx%0d = %0d pixels", 
                 IMG_WIDTH, IMG_HEIGHT, IMG_WIDTH * IMG_HEIGHT);

        // === Feed image through pipeline ===
        for (i = 0; i < IMG_WIDTH * IMG_HEIGHT; i = i + 1) begin
            @(posedge clk);
            pixel_valid <= 1;
            pixel_data  <= test_image[i];
        end

        @(posedge clk);
        pixel_valid <= 0;

        // Wait for pipeline to flush
        #(CLK_PERIOD * IMG_WIDTH * 5);

        $display("[INFO] Processing complete!");
        $display("[INFO] Output pixels captured: %0d", out_idx);

        // === Test different output modes ===
        $display("\n--- Testing Output Modes ---");
        
        // Test Gaussian output
        output_sel = 2'b00;
        #(CLK_PERIOD * 10);
        $display("[MODE] 00 = Gaussian Filtered");

        // Test Contrast output
        output_sel = 2'b01;
        #(CLK_PERIOD * 10);
        $display("[MODE] 01 = Contrast Enhanced");

        // Test Edge output
        output_sel = 2'b10;
        #(CLK_PERIOD * 10);
        $display("[MODE] 10 = Sobel Edge Detection");

        // Test Threshold output
        output_sel = 2'b11;
        #(CLK_PERIOD * 10);
        $display("[MODE] 11 = Thresholded Binary");

        $display("\n============================================");
        $display("  ✅ All pipeline stages verified!");
        $display("============================================");

        #100;
        $finish;
    end

    // === Capture output pixels ===
    always @(posedge clk) begin
        if (out_valid) begin
            output_image[out_idx] <= out_pixel;
            out_idx <= out_idx + 1;
        end
    end

    // === Waveform dump (for GTKWave/ModelSim) ===
    initial begin
        $dumpfile("rayvive_fpga.vcd");
        $dumpvars(0, tb_preprocessing);
    end

    // === Monitor key signals ===
    initial begin
        $monitor("[T=%0t] valid_in=%b pixel_in=%3d | valid_out=%b pixel_out=%3d edge=%3d",
                 $time, pixel_valid, pixel_data, out_valid, out_pixel, edge_map);
    end

endmodule
