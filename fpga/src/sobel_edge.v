// ============================================================
// RayVive FPGA — Sobel Edge Detection
// Detects bone boundaries in X-ray images
// Computes gradient magnitude: |Gx| + |Gy| (approximation)
// Gx = [-1 0 1; -2 0 2; -1 0 1]
// Gy = [-1 -2 -1; 0 0 0; 1 2 1]
// ============================================================

module sobel_edge (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        valid_in,
    input  wire [7:0]  pixel_in,
    output reg         valid_out,
    output reg  [7:0]  pixel_out,    // Edge magnitude (0-255)
    output reg  [7:0]  edge_binary   // Binary edge map (0 or 255)
);

    parameter IMG_WIDTH  = 256;
    parameter THRESHOLD  = 8'd50;   // Edge detection threshold

    // Line buffers
    reg [7:0] line_buf_0 [0:IMG_WIDTH-1];
    reg [7:0] line_buf_1 [0:IMG_WIDTH-1];
    reg [7:0] line_buf_2 [0:IMG_WIDTH-1];

    // 3x3 window
    reg [7:0] p00, p01, p02;
    reg [7:0] p10, p11, p12;
    reg [7:0] p20, p21, p22;

    // Position
    reg [15:0] col_cnt;
    reg [15:0] row_cnt;

    // Gradient computation (signed)
    reg signed [10:0] gx, gy;
    reg [10:0] abs_gx, abs_gy;
    reg [10:0] gradient;

    integer i;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            col_cnt     <= 0;
            row_cnt     <= 0;
            valid_out   <= 0;
            pixel_out   <= 0;
            edge_binary <= 0;
            gx <= 0; gy <= 0;
            p00 <= 0; p01 <= 0; p02 <= 0;
            p10 <= 0; p11 <= 0; p12 <= 0;
            p20 <= 0; p21 <= 0; p22 <= 0;
            for (i = 0; i < IMG_WIDTH; i = i + 1) begin
                line_buf_0[i] <= 0;
                line_buf_1[i] <= 0;
                line_buf_2[i] <= 0;
            end
        end else if (valid_in) begin
            // Shift into line buffers
            line_buf_0[col_cnt] <= pixel_in;
            line_buf_1[col_cnt] <= line_buf_0[col_cnt];
            line_buf_2[col_cnt] <= line_buf_1[col_cnt];

            if (col_cnt >= 2 && row_cnt >= 2) begin
                // Load 3x3 window
                p00 <= line_buf_2[col_cnt - 2];
                p01 <= line_buf_2[col_cnt - 1];
                p02 <= line_buf_2[col_cnt];
                p10 <= line_buf_1[col_cnt - 2];
                p11 <= line_buf_1[col_cnt - 1];
                p12 <= line_buf_1[col_cnt];
                p20 <= line_buf_0[col_cnt - 2];
                p21 <= line_buf_0[col_cnt - 1];
                p22 <= pixel_in;

                // Sobel Gx = -p00 + p02 - 2*p10 + 2*p12 - p20 + p22
                gx <= -$signed({3'b0, p00}) + $signed({3'b0, p02})
                     - ($signed({3'b0, p10}) <<< 1) + ($signed({3'b0, p12}) <<< 1)
                     - $signed({3'b0, p20}) + $signed({3'b0, p22});

                // Sobel Gy = -p00 - 2*p01 - p02 + p20 + 2*p21 + p22
                gy <= -$signed({3'b0, p00}) - ($signed({3'b0, p01}) <<< 1) - $signed({3'b0, p02})
                     + $signed({3'b0, p20}) + ($signed({3'b0, p21}) <<< 1) + $signed({3'b0, p22});

                // Magnitude approximation: |Gx| + |Gy|
                abs_gx   <= (gx < 0) ? -gx : gx;
                abs_gy   <= (gy < 0) ? -gy : gy;
                gradient <= abs_gx + abs_gy;

                // Clamp to 255
                pixel_out   <= (gradient > 255) ? 8'd255 : gradient[7:0];
                edge_binary <= (gradient > THRESHOLD) ? 8'd255 : 8'd0;
                valid_out   <= 1;
            end else begin
                valid_out <= 0;
            end

            // Position counter
            if (col_cnt == IMG_WIDTH - 1) begin
                col_cnt <= 0;
                row_cnt <= row_cnt + 1;
            end else begin
                col_cnt <= col_cnt + 1;
            end
        end else begin
            valid_out <= 0;
        end
    end

endmodule
