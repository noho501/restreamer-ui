import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Trans } from '@lingui/macro';
import makeStyles from '@mui/styles/makeStyles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';
import Typography from '@mui/material/Typography';

import useInterval from '../../hooks/useInterval';
import Egress from './Egress';
import H from '../../utils/help';
import Number from '../../misc/Number';
import Paper from '../../misc/Paper';
import PaperHeader from '../../misc/PaperHeader';
import Services from '../Publication/Services';

import { getLiveComment, getLiveReactions, isLoggedIn, login } from '../../services/facebook';
import Comments from '../Comments';
import CommentStatistic from '../Comments/Statistic';

const useStyles = makeStyles((theme) => ({
	viewerCount: {
		fontSize: '3.5rem',
		fontWeight: 600,
	},
	vierwerDescription: {
		marginTop: '-1em',
	},
	vierwerTypo: {
		fontSize: '1.1rem',
	},
	comment: {
		fontSize: '1rem',
	},
	commentUser: {
		fontSize: '1rem',
	},
	bandwidth: {
		marginBottom: '.3em',
	},
	bandwidthCount: {
		fontSize: '2.5rem',
		fontWeight: 600,
	},
	bandwidthDescription: {
		marginTop: '-.5em',
	},
	bandwidthIcon: {
		fontSize: '1.7rem',
		paddingRight: 7,
	},
}));

export default function Publication(props) {
	const classes = useStyles();

	const navigate = useNavigate();
	const services = Services.IDs();
	const [$egresses, setEgresses] = React.useState([]);
	const [$comments, setComments] = React.useState({});
	const [$reactionStatistic, setReactionStatistic] = React.useState({
		likes: 0,
		comments: 0,
	})
	const [$session, setSession] = React.useState({
		viewer: 0,
		bandwidth: 0,
	});

	useInterval(async () => {
		await update();
	}, 1000);

	useInterval(async () => {
		await sessions();
	}, 1000);

	React.useEffect(() => {
		(async () => {
			await update();
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = async () => {
		const egresses = [];

		const processes = await props.restreamer.ListIngestEgresses(props.channelid, services);

		for (let p of processes) {
			egresses.push({
				id: p.id,
				name: p.name,
				service: p.service,
				index: p.index,
				progress: p.progress,
				socialLiveVideoId: p.socialLiveVideoId,
				profileId: p.profileId,
			});
		}

		setEgresses(egresses);
	};

	const sessions = async () => {
		const current = await props.restreamer.CurrentSessions(['ffmpeg', 'hls', 'rtmp', 'srt']);

		setSession({
			viewer: current.sessions,
			bandwidth: current.bitrate_kbit,
		});
	};

	const handleServiceAdd = (event) => {
		event.preventDefault();

		navigate(`/${props.channelid}/publication/`);
	};

	const handleServiceEdit = (service, index) => () => {
		let target = `/${props.channelid}/publication/${service}`;

		if (service !== 'player') {
			target = target + '/' + index;
		}

		navigate(target);
	};

	const handleOrderChange = (id) => async (order) => {
		let res = false;

		if (order === 'start') {
			res = await props.restreamer.StartEgress(props.channelid, id);
		} else if (order === 'restart') {
			res = await props.restreamer.StopEgress(props.channelid, id);
			if (res === true) {
				res = await props.restreamer.StartEgress(props.channelid, id);
			}
		} else if (order === 'stop') {
			res = await props.restreamer.StopEgress(props.channelid, id);
		}

		return res;
	};

	const handleFetchComments =
		(socialLiveVideoId, profileId) =>
		async (reset = false) => {
			if (!socialLiveVideoId || !profileId) {
				return;
			}

			if (reset) {
				setComments({
					...$comments,
					[socialLiveVideoId]: [],
				});
				return;
			}
			const isLogged = await isLoggedIn();
			if (!isLogged || !props.restreamer.currentFbInfo?.accounts) {
				const response = await login();
				props.restreamer.SetFBInfo(response);
			}
			const accessToken = props.restreamer.GetFbAccountAccessToken(profileId);
			const currentComment = $comments[socialLiveVideoId] || [];
			const previousLastComments = currentComment.at(-1);
			const previousLastCommentTimestamp = previousLastComments ? Math.floor(new Date(previousLastComments.created_time).getTime() / 1000) + 1 : 0;
			const result = await getLiveComment(socialLiveVideoId, accessToken, previousLastCommentTimestamp);
			const reactions = await getLiveReactions(socialLiveVideoId, accessToken);
			const { data: _comments, summary } = result;
			const { summary: reactionSummary } = reactions;
			const comments = _comments.map((item) => ({
				...item,
				picture: item.from?.picture?.data?.url || '',
			}));
			setComments({
				...$comments,
				[socialLiveVideoId]: [...currentComment, ...comments],
			});
			setReactionStatistic(_prev => ({
				..._prev,
				comments: summary?.total_count || 0,
				likes: reactionSummary?.total_count || 0,
			}))
		};

	const handleHelp = () => {
		H('publication');
	};

	let egresses = [];
	const displayComments = Object.values($comments).filter((items) => items.length);

	for (let e of $egresses.values()) {
		egresses.push(
			<React.Fragment key={e.id}>
				<Grid item xs={12}>
					<Divider />
				</Grid>
				<Grid item xs={12}>
					<Egress
						service={e.service}
						name={e.name}
						state={e.progress.state}
						order={e.progress.order}
						socialLiveVideoId={e.socialLiveVideoId}
						comments={$comments[e.socialLiveVideoId]}
						reconnect={e.progress.reconnect !== -1}
						onEdit={handleServiceEdit(e.service, e.index)}
						onOrder={handleOrderChange(e.id)}
						onFetchComment={handleFetchComments(e.socialLiveVideoId, e.profileId)}
					/>
				</Grid>
			</React.Fragment>
		);
	}

	return (
		<React.Fragment>
			<Paper marginBottom="12px">
				<PaperHeader title={<Trans>Publications</Trans>} onAdd={handleServiceAdd} onHelp={handleHelp} />
				<Grid container spacing={1}>
					<Grid item xs={12} align="center">
						<Divider />
						<Typography component="div" className={classes.viewerCount}>
							<Number value={$session.viewer} />
						</Typography>
						<Grid container direction="row" justifyContent="center" alignItems="center" className={classes.vierwerDescription}>
							<PersonIcon fontSize="small" />
							<Typography className={classes.vierwerTypo}>
								<Trans>Viewer</Trans>
							</Typography>
						</Grid>
					</Grid>
					<Grid item xs={12} align="center" className={classes.bandwidth}>
						<Typography component="div" className={classes.bandwidthCount}>
							<Number value={$session.bandwidth} />
						</Typography>
						<Grid container direction="row" justifyContent="center" alignItems="center" className={classes.bandwidthDescription}>
							<CloudUploadIcon className={classes.bandwidthIcon} />
							<Typography>
								<Trans>kbit/s</Trans>
							</Typography>
						</Grid>
					</Grid>
					{egresses}
				</Grid>
			</Paper>

			<CommentStatistic statistics={$reactionStatistic} />

			{displayComments.map((comments, idx) => (
				<Comments comments={comments} key={idx} />
			))}
		</React.Fragment>
	);
}

Publication.defaultProps = {
	channelid: '',
	restreamer: null,
};
