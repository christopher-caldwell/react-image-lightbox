import { FC, PropsWithChildren } from 'react'
import { Toolbar, Typography, Link, Button, Box } from '@mui/material'

export const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
        <Typography
          component={Link}
          href='https://github.com/christopher-caldwell-react-lightbox'
          target='_blank'
          rel='noopener noreferrer'
          variant='h6'
        >
          @caldwell619/react-image-lightbox
        </Typography>
        <Typography variant='subtitle1'>
          A flexible lightbox component for displaying images in a React project.
        </Typography>
      </Toolbar>
      <Box
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 100px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {children}
        <Link
          href='https://github.com/christopher-caldwell/react-lightbox/blob/master/demo/src/App.tsx'
          target='_blank'
          rel='noopener noreferrer'
          variant='h6'
        >
          <Button>Demo Source</Button>
        </Link>
      </Box>
    </>
  )
}
