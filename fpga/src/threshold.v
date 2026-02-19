// ============================================================
// RayVive FPGA — Adaptive Threshold Module
// Separates bone regions from background in X-ray images
// Supports: Binary, Inverted, and Band thresholding
// ============================================================

module threshold (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        valid_in,
    input  wire [7:0]  pixel_in,
    input  wire [7:0]  thresh_low,   // Lower threshold (default: 128)
    input  wire [7:0]  thresh_high,  // Upper threshold (for band mode)
    input  wire [1:0]  mode,         // 00=binary, 01=inverted, 10=band
    output reg         valid_out,
    output reg  [7:0]  pixel_out
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            pixel_out <= 0;
            valid_out <= 0;
        end else if (valid_in) begin
            valid_out <= 1;
            
            case (mode)
                2'b00: begin  // Binary threshold
                    pixel_out <= (pixel_in >= thresh_low) ? 8'd255 : 8'd0;
                end

                2'b01: begin  // Inverted threshold
                    pixel_out <= (pixel_in >= thresh_low) ? 8'd0 : 8'd255;
                end

                2'b10: begin  // Band threshold (isolate bone density range)
                    pixel_out <= (pixel_in >= thresh_low && pixel_in <= thresh_high) 
                                 ? 8'd255 : 8'd0;
                end

                default: begin
                    pixel_out <= pixel_in;  // Pass-through
                end
            endcase
        end else begin
            valid_out <= 0;
        end
    end

endmodule
