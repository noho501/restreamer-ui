import React from 'react';
import { useParams } from 'react-router-dom';

import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/lab/LoadingButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import _isEqual from 'lodash/isEqual';
import usePrevious from '../../../hooks/usePrevious';

import './styles.css';

import { login as onLoginFacebook, logout as onLogoutFacebook } from '../../../services/facebook';

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
const PAGE_ME_ID = 'ME';
const SCREENS = {
	LIST: 'list',
	CREATE_EVENT: 'create_event',
	EVENT: 'event',
};

function ServiceIcon(props) {
	return <FontAwesomeIcon icon={faFacebook} style={{ color: '#2D88FF' }} {...props} />;
}

const ServiceLoginButton = ({ cbLogin, cbLogout, setAuthenticated, authenticated }) => {
	const { channelid } = useParams();
	const [snack, setSnack] = React.useState({
		open: false,
		message: '',
		severity: 'success',
	});
	const [loading, setLoading] = React.useState(false);

	const handleLoginFb = () => {
		setLoading(true);

		onLoginFacebook()
			.then(async (res) => {
				if (cbLogin) {
					await cbLogin(id, channelid, { oauth_fb_access_token: res?.accessToken, oauth_fb_user_id: res?.userId });
				}

				setAuthenticated(true);
				setLoading(false);
			})
			.catch((e) => {
				setSnack({ message: e.message || 'Login fail', severity: 'error', open: true });
				setLoading(false);
			});
	};

	const handleLogoutFb = () => {
		setLoading(true);

		setTimeout(() => {
			onLogoutFacebook()
				.then(async () => {
					if (cbLogout) await cbLogout(id, channelid);
					setAuthenticated(false);
					setLoading(false);
				})
				.catch(() => {
					setLoading(false);
				});
		}, [1000]);
	};

	const handleCloseSnack = () => {
		setSnack({ open: false, message: '', severity: 'success' });
	};

	if (authenticated) {
		return (
			<Button
				loading={loading}
				size="small"
				sx={[{ color: '#FFF', backgroundColor: '#747171d6', textTransform: 'capitalize' }, { '&:hover': { backgroundColor: '#747171d6' } }]}
				onClick={handleLogoutFb}
			>
				<Trans>Log out</Trans>
			</Button>
		);
	}

	return (
		<>
			<Button
				loading={loading}
				size="small"
				sx={[{ color: '#FFF', backgroundColor: '#4267B2', textTransform: 'capitalize' }, { '&:hover': { backgroundColor: '#4267B2' } }]}
				onClick={handleLoginFb}
			>
				<Trans>Login</Trans>
			</Button>
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
		</>
	);
};

function init(settings) {
	const initSettings = {
		stream_key_primary: '',
		stream_key_backup: '',
		rtmp_primary: true,
		rtmp_backup: false,
		...settings,
	};

	return initSettings;
}

function Service(props) {
	const { authenticated, setAuthenticated, channelId, restreamer, onServiceDone } = props;
	const settings = init(props.settings);
	const [accountInfo, setAccountInfo] = React.useState({});
	const [livestream, setLivestream] = React.useState({});
	const [eventMeta, setEventMeta] = React.useState({ title: '', description: '' });
	const [avatar, setAvatar] = React.useState('');
	const [pageSelected, setPageSelected] = React.useState({});
	const [isLiveCreating, setIsLiveCreating] = React.useState(false);
	const [snack, setSnack] = React.useState({
		open: false,
		message: '',
		severity: 'success',
	});
	const [currentScreen, setCurrentScreen] = React.useState(SCREENS.LIST);
	const prevSettings = usePrevious(props.settings);

	React.useEffect(() => {
		if (livestream?.id && !_isEqual(props.settings, prevSettings) && onServiceDone) {
			onServiceDone();
		}
	}, [props.settings]);

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
		if (authenticated && restreamer?.GetFBAccountInfo) {
			restreamer
				.GetFBAccountInfo(channelId)
				.then((info) => {
					setAccountInfo(info);
				})
				.catch((e) => {
					if (e?.details?.includes('fb_err_190')) {
						setSnack({ message: 'Phiên đăng nhập hết hạn', severity: 'error', open: true });
					}
				});

			if (restreamer?.GetFBMePicture) {
				restreamer
					.GetFBMePicture(channelId)
					.then((picture) => {
						setAvatar(picture?.url || '');
					})
					.catch((e) => {
						setAvatar('');
					});
			}
		}
	}, [authenticated]);

	const handleChangeStreamKey = (live) => {
		const streamKeySplit = String(live?.secure_stream_url).split('/');

		settings.stream_key_primary = streamKeySplit[streamKeySplit.length - 1];

		const outputs = [];

		const output_primary = {
			address: live?.secure_stream_url,
			options: ['-f', 'flv'],
		};

		if (settings.stream_key_primary.length !== 0 && settings.rtmp_primary) {
			outputs.push(output_primary);
		}

		props.onChange(outputs, settings);
	};

	const handleBackCreateLivestream = () => {
		setPageSelected({});
		setEventMeta({ title: '', description: '' });
		navigateScreen(SCREENS.LIST);
	};

	const handleClickPage = (page) => {
		setPageSelected(page);
		navigateScreen(SCREENS.CREATE_EVENT);
	};

	const navigateScreen = (screen) => {
		setCurrentScreen(screen);
	};

	const handleCreateLivestream = () => {
		if (pageSelected?.id === PAGE_ME_ID && restreamer?.CreateFbLiveStreamOnMyTimeline) {
			setIsLiveCreating(true);

			restreamer
				.CreateFbLiveStreamOnMyTimeline(channelId, { title: eventMeta?.title, description: eventMeta?.description })
				.then((live) => {
					setLivestream(live);
					handleChangeStreamKey(live);
					navigateScreen(SCREENS.EVENT);
				})
				.catch((e) => {
					setSnack({ message: e.message || 'Không thể tạo livestream', severity: 'error', open: true });
				})
				.finally(() => {
					setIsLiveCreating(false);
				});
		} else if (pageSelected?.id && restreamer?.CreateFbLiveStream) {
			setIsLiveCreating(true);

			restreamer
				.CreateFbLiveStream(channelId, pageSelected.id, { title: eventMeta?.title, description: eventMeta?.description })
				.then((live) => {
					setLivestream(live);
					handleChangeStreamKey(live);
					navigateScreen(SCREENS.EVENT);
				})
				.catch((e) => {
					setSnack({ message: e.message || 'Không thể tạo livestream', severity: 'error', open: true });
				})
				.finally(() => {
					setIsLiveCreating(false);
				});
		}
	};

	const handleChangeEventMeta = (e) => {
		const { name, value } = e.target;

		setEventMeta({ ...eventMeta, [name]: value });
	};

	if (!authenticated) return null;

	if (!Array.isArray(accountInfo?.data) || accountInfo.data.length === 0) return null;

	if (currentScreen === SCREENS.EVENT) {
		if (!livestream?.id) return null;

		return (
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<TextField variant="outlined" fullWidth label={<Trans>Service Name</Trans>} value="Facebook Live" onChange={() => {}} />
				</Grid>
				<Grid item xs={12}>
					<TextField variant="outlined" fullWidth label={<Trans>Title</Trans>} value={eventMeta.title} onChange={() => {}} />
				</Grid>
				<Grid item xs={12}>
					<TextField
						variant="outlined"
						fullWidth
						multiline
						rows={3}
						label={<Trans>Description</Trans>}
						value={eventMeta.description}
						onChange={() => {}}
					/>
				</Grid>
				<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button variant="outlined" color="success" onClick={handleBackCreateLivestream}>
						Change
					</Button>
					&nbsp;&nbsp;
					<Button variant="outlined" onClick={() => { navigateScreen(SCREENS.CREATE_EVENT) }}>Edit</Button>
				</Grid>
			</Grid>
		);
	}

	if (currentScreen === SCREENS.CREATE_EVENT) {
		if (!pageSelected?.id) return null;

		return (
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<ArrowBackIcon sx={{ cursor: 'pointer' }} onClick={handleBackCreateLivestream} />
						<span>Create Event</span>
						<Avatar alt="Remy Sharp" src={avatar} />
					</Box>
				</Grid>
				<Grid item xs={12}>
					<TextField variant="outlined" fullWidth label="Title" name="title" value={eventMeta.title} onChange={handleChangeEventMeta} />
				</Grid>
				<Grid item xs={12}>
					<TextField
						variant="outlined"
						fullWidth
						label="Description"
						multiline
						rows={3}
						name="description"
						value={eventMeta.description}
						onChange={handleChangeEventMeta}
					/>
				</Grid>
				<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }} className="fb_btn_create_event">
					<Button
						variant="contained"
						loading={isLiveCreating}
						onClick={handleCreateLivestream}
						disabled={isLiveCreating || !eventMeta.title || !eventMeta.description}
						color="success"
						sx={{ color: '#FFF' }}
					>
						Create
					</Button>
				</Grid>
				<Backdrop
					sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
					open={isLiveCreating}
				>
					<CircularProgress color="inherit" />
				</Backdrop>
			</Grid>
		);
	}

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<List sx={{ width: '100%' }}>
					<ListItem
						dense={false}
						sx={{ backgroundColor: '#FFF', marginBottom: 1, borderRadius: 1, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)', cursor: 'pointer' }}
						onClick={() => {
							handleClickPage({ id: PAGE_ME_ID, image: avatar });
						}}
					>
						<ListItemAvatar>
							<Avatar>
								<img src={avatar} alt="avatar" />
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary={<span style={{ color: '#004185', fontWeight: 'bold' }}>Publish on my timeline</span>} />
					</ListItem>
					{accountInfo.data.map((page) => (
						<ListItem
							dense={false}
							key={page.id}
							sx={{ backgroundColor: '#FFF', marginBottom: 1, borderRadius: 1, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)', cursor: 'pointer' }}
							onClick={() => {
								handleClickPage({ id: page.id, image: page.picture?.data?.url });
							}}
						>
							<ListItemAvatar>
								<Avatar>
									<img src={page.picture?.data?.url} alt={page.name} />
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

Service.defaultProps = {
	settings: {},
	skills: {},
	metadata: {},
	streams: [],
	onChange: function (output, settings) {},
};

export {
	id,
	name,
	version,
	stream_key_link,
	description,
	image_copyright,
	author,
	category,
	requires,
	ServiceIcon as icon,
	Service as component,
	ServiceLoginButton as loginButton,
};
