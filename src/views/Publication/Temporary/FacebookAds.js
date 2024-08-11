import React from 'react';

import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import _isEqual from 'lodash/isEqual';
import usePrevious from '../../../hooks/usePrevious';

import './styles.css';

import { getAdsPage, getAdsPageDetail } from '../../../services/facebook';
import { Stack, Typography } from '@mui/material';

const id = 'facebook';
const name = 'Facebook Live';
const version = '1.0';
const stream_key_link = 'https://www.facebook.com/live/producer?ref=datarhei/restreamer';
const description = <Trans>Live-Streaming to Facebook Live RTMP service</Trans>;
const image_copyright = <Trans>More about licenses here</Trans>;
const author = {
	creator: {
		name: 'datarhei',
		link: 'https://github.com/datarhei',
	},
	maintainer: {
		name: 'datarhei',
		link: 'https://github.com/datarhei',
	},
};
const category = 'platform';
const requires = {
	protocols: ['rtmps'],
	formats: ['flv'],
	codecs: {
		audio: ['aac'],
		video: ['h264'],
	},
};
const SCREENS = {
	LIST: 'list',
	SELECTED_PAGE: 'selected_page',
};

function FacebookAds(props) {
	const { authenticated, setAuthenticated, channelId, restreamer, screen } = props;
	const [accessToken, setAccessToken] = React.useState(null);
	console.log('🚀 ~ FacebookAds ~ accessToken:', accessToken);
	const [adsPage, setAdsPage] = React.useState({});
	const [adsPageDetail, setAdsPageDetail] = React.useState({});
	const [snack, setSnack] = React.useState({
		open: false,
		message: '',
		severity: 'success',
	});
	const [pageSelected, setPageSelected] = React.useState({});
	const [currentScreen, setCurrentScreen] = React.useState(screen || SCREENS.LIST);
	const prevSettings = usePrevious(props.settings);

	const handleCloseSnack = () => {
		setSnack({ open: false, message: '', severity: 'success' });
	};

	React.useEffect(() => {
		(async () => {
			if (!authenticated && restreamer?.CheckAuthFb) {
				const status = await restreamer.CheckAuthFb(channelId).catch(() => ({ is_authenticated: false }));

				if (authenticated !== !!status.is_authenticated) {
					setAuthenticated(!!status?.is_authenticated);
				}
			}
		})();
	}, []);

	React.useEffect(() => {
		if (authenticated) {
			restreamer?.ReLoginFacebookInClient().then(async (result) => {
				console.log('🚀 ~ restreamer?.ReLoginFacebookInClient ~ result:', result);
				if (result) {
					setAccessToken(result.accessToken);
				}
			});
		}
	}, [authenticated]);

	React.useEffect(() => {
		if (accessToken) {
			getAdsPage(accessToken).then((response) => {
				console.log('🚀 ~ getAdsPage ~ response:', response);
				setAdsPage(response || {});
			});
		}
	}, [accessToken]);

	React.useEffect(() => {
		if (pageSelected?.id && accessToken) {
			getAdsPageDetail(pageSelected.id, accessToken).then((response) => {
				console.log('🚀 ~ getAdsPageDetail ~ response:', response);
				setAdsPageDetail(response || {});
			});
		}
	}, [pageSelected?.id, accessToken]);

	const handleClickPage = (page) => {
		setPageSelected({
			...page,
			items: [],
		});
		navigateScreen(SCREENS.SELECTED_PAGE);
	};

	const navigateScreen = (screen) => {
		setCurrentScreen(screen);
	};

	if (!authenticated || !accessToken) return null;

	if (currentScreen === SCREENS.SELECTED_PAGE) {
		if (!pageSelected?.id) return null;

		return (
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<ArrowBackIcon
							sx={{ cursor: 'pointer' }}
							onClick={() => {
								setPageSelected({});
								navigateScreen(SCREENS.LIST);
							}}
						/>
						<span>{pageSelected?.name}</span>
					</Box>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="h3">List Owned Ad Accounts</Typography>
				</Grid>
				<Grid item xs={12}>
					<Stack direction="row">
						<List sx={{ width: '100%' }}>
							{adsPageDetail?.data?.map((page) => (
								<ListItem
									dense={false}
									key={page.id}
									sx={{
										backgroundColor: '#FFF',
										marginBottom: 1,
										borderRadius: 1,
										boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
										cursor: 'pointer',
									}}
								>
									<ListItemAvatar>
										<Avatar>
											<img src={'/page'} alt={page.name} />
										</Avatar>
									</ListItemAvatar>
									<ListItemText
										primary={
											<span style={{ color: '#313234', fontWeight: 'bold' }}>
												{page.name} (Balance: {page.balance})
											</span>
										}
									/>
								</ListItem>
							))}
						</List>
					</Stack>
				</Grid>
			</Grid>
		);
	}

	if (!Array.isArray(adsPage?.data)) return null;

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<List sx={{ width: '100%' }}>
					{adsPage.data.map((page) => (
						<ListItem
							dense={false}
							key={page.id}
							sx={{ backgroundColor: '#FFF', marginBottom: 1, borderRadius: 1, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)', cursor: 'pointer' }}
							onClick={() => {
								handleClickPage({ id: page.id, name: page.name });
							}}
						>
							<ListItemAvatar>
								<Avatar>
									<img src={'/page'} alt={page.name} />
								</Avatar>
							</ListItemAvatar>
							<ListItemText primary={<span style={{ color: '#313234', fontWeight: 'bold' }}>{page.name}</span>} />
						</ListItem>
					))}
				</List>
			</Grid>
			<Snackbar
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				open={snack.open}
				autoHideDuration={3000}
				onClose={handleCloseSnack}
			>
				<Alert variant="filled" elevation={6} onClose={handleCloseSnack} severity={snack.severity}>
					{snack.message}
				</Alert>
			</Snackbar>
		</Grid>
	);
}

export { FacebookAds };
