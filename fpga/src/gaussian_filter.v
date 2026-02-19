// ============================================================
// RayVive FPGA — 3x3 Gaussian Blur Filter
// Reduces noise in X-ray images using weighted average
// Kernel: [1 2 1; 2 4 2; 1 2 1] / 16
// ============================================================

module gaussian_filter (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        valid_in,
    input  wire [7:0]  pixel_in,    // 8-bit grayscale input
    output reg         valid_out,
    output reg  [7:0]  pixel_out    // Filtered output
);

    // Line buffers for 3 rows (assuming 256-pixel width image)
    parameter IMG_WIDTH = 256;

    reg [7:0] line_buf_0 [0:IMG_WIDTH-1];
    reg [7:0] line_buf_1 [0:IMG_WIDTH-1];
    reg [7:0] line_buf_2 [0:IMG_WIDTH-1];

    // 3x3 pixel window
    reg [7:0] p00, p01, p02;
    reg [7:0] p10, p11, p12;
    reg [7:0] p20, p21, p22;

    // Position counters
    reg [15:0] col_cnt;
    reg [15:0] row_cnt;
    reg [1:0]  fill_count;  // counts which line buffer to fill

    // Gaussian weighted sum
    wire [15:0] gauss_sum;
    
    // Kernel weights: [1 2 1; 2 4 2; 1 2 1] => total weight = 16
    assign gauss_sum = (p00)      + (p01 << 1) + (p02)      +
                       (p10 << 1) + (p11 << 2) + (p12 << 1) +
                       (p20)      + (p21 << 1) + (p22);

    integer i;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            col_cnt    <= 0;
            row_cnt    <= 0;
            fill_count <= 0;
            valid_out  <= 0;
            pixel_out  <= 0;
            p00 <= 0; p01 <= 0; p02 <= 0;
            p10 <= 0; p11 <= 0; p12 <= 0;
            p20 <= 0; p21 <= 0; p22 <= 0;
            for (i = 0; i < IMG_WIDTH; i = i + 1) begin
                line_buf_0[i] <= 0;
                line_buf_1[i] <= 0;
                line_buf_2[i] <= 0;
            end
        end else if (valid_in) begin
            // Shift pixels into line buffers (circular)
            line_buf_0[col_cnt] <= pixel_in;
            line_buf_1[col_cnt] <= line_buf_0[col_cnt];
            line_buf_2[col_cnt] <= line_buf_1[col_cnt];

            // Build 3x3 window from line buffers
            if (col_cnt >= 2 && row_cnt >= 2) begin
                p00 <= line_buf_2[col_cnt - 2];
                p01 <= line_buf_2[col_cnt - 1];
                p02 <= line_buf_2[col_cnt];
                p10 <= line_buf_1[col_cnt - 2];
                p11 <= line_buf_1[col_cnt - 1];
                p12 <= line_buf_1[col_cnt];
                p20 <= line_buf_0[col_cnt - 2];
                p21 <= line_buf_0[col_cnt - 1];
                p22 <= pixel_in;

                // Divide by 16 (right shift 4)
                pixel_out <= gauss_sum[11:4];
                valid_out <= 1;
            end else begin
                valid_out <= 0;
            end

            // Update position
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
