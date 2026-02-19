// ============================================================
// RayVive FPGA — Contrast Enhancement (Linear Stretching)
// Enhances X-ray contrast by stretching pixel range to 0-255
// Formula: out = (pixel - min_val) * 255 / (max_val - min_val)
// Two-pass: Pass 1 finds min/max, Pass 2 applies stretch
// ============================================================

module contrast_enhance (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        valid_in,
    input  wire [7:0]  pixel_in,
    input  wire        pass,          // 0 = find min/max, 1 = apply
    output reg         valid_out,
    output reg  [7:0]  pixel_out,
    output reg  [7:0]  min_val,       // Detected minimum
    output reg  [7:0]  max_val        // Detected maximum
);

    reg [15:0] numerator;
    reg [7:0]  range;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            min_val   <= 8'hFF;
            max_val   <= 8'h00;
            pixel_out <= 0;
            valid_out <= 0;
            range     <= 1;
        end else if (valid_in) begin
            if (pass == 0) begin
                // Pass 1: Find min and max pixel values
                if (pixel_in < min_val) min_val <= pixel_in;
                if (pixel_in > max_val) max_val <= pixel_in;
                valid_out <= 0;
            end else begin
                // Pass 2: Apply contrast stretching
                range <= (max_val > min_val) ? (max_val - min_val) : 8'd1;

                if (pixel_in <= min_val) begin
                    pixel_out <= 8'd0;
                end else if (pixel_in >= max_val) begin
                    pixel_out <= 8'd255;
                end else begin
                    // Scaled: (pixel - min) * 255 / range
                    numerator <= (pixel_in - min_val) * 8'd255;
                    pixel_out <= numerator / range;
                end
                valid_out <= 1;
            end
        end else begin
            valid_out <= 0;
        end
    end

endmodule
