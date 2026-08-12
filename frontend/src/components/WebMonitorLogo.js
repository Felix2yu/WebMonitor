import { Box } from '@mui/material';

const faviconSrc = `${process.env.PUBLIC_URL || ''}/favicon.svg`;

const WebMonitorLogo = ({ size = 40, ...props }) => {
  return (
    <Box
      component="img"
      src={faviconSrc}
      alt="WebMonitor"
      sx={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        ...props.sx,
      }}
    />
  );
};

export { WebMonitorLogo };
export default WebMonitorLogo;
