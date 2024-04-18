import { Container, Text } from "@pixi/react";
import colors from "material-colors";
import { TextStyle } from "pixi.js";

const Watermark = ({ text, width, height }) => {
  return (
    <Container>
      {text && (
        <Text
          text={text}
          anchor={{ x: 1, y: 1 }}
          x={width - 12}
          y={height - 12}
          style={
            new TextStyle({
              fontFamily:
                'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              fontSize: 18,
              fontWeight: "600",
              fill: colors.blueGrey[800],
              stroke: "#ffffff",
              strokeThickness: 2,
            })
          }
        />
      )}
      {!text && (
        <Text
          text="by"
          anchor={{ x: 1, y: 1 }}
          x={width - 99}
          y={height - 12}
          style={
            new TextStyle({
              fontFamily:
                'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: 12,
              fontWeight: "400",
              fill: colors.blueGrey[800],
              stroke: "#ffffff",
              strokeThickness: 2,
            })
          }
        />
      )}
      {!text && (
        <Text
          text="PuppyGraph"
          anchor={{ x: 1, y: 1 }}
          x={width - 12}
          y={height - 12}
          style={
            new TextStyle({
              fontFamily:
                'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              fontSize: 14,
              fontWeight: "600",
              fill: colors.blueGrey[600],
              stroke: "#ffffff",
              strokeThickness: 2,
            })
          }
        />
      )}
    </Container>
  );
};

export default Watermark;
