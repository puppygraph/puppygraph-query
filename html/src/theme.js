import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5e2f76',
    },
    secondary: {
      main: '#f1c159',
    },
  }, 
  typography: {
    button: {
      textTransform: 'none',
      fontWeight: 500,
    }
  }
});

export default theme;
