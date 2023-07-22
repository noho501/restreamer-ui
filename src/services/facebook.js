export const login = () =>
	new Promise(async (rs, rj) => {
		window.FB.getLoginStatus(function (response) {
			if (response.status === 'connected') {
				getAccountInfo().then(({ data: accounts }) =>
					rs({ userId: response.authResponse.userID, accessToken: response.authResponse.accessToken, accounts })
				);
			} else {
				window.FB.login(
					function (res) {
						if (res?.authResponse?.accessToken) {
							getAccountInfo().then(({ data: accounts }) =>
								rs({ userId: res.authResponse.userID, accessToken: res.authResponse.accessToken, accounts })
							);
						} else {
							rj('User cancelled login');
						}
					},
					{ scope: 'public_profile,pages_manage_posts,publish_video,pages_read_user_content' }
				);
			}
		}, true);
	});

export const isLoggedIn = () => {
	return new Promise(async (rs) => {
		window.FB.getLoginStatus(function (response) {
			rs(response.status === 'connected' ? true : false);
		});
	});
};

export const logout = async () =>
	new Promise(async (rs) => {
		const isLogged = await isLoggedIn();

		if (isLogged) {
			window.FB.logout(function (res) {
				rs(true);
			});
		}

		rs(true);
	});

export const getAccountInfo = () => {
	return new Promise((rs, rj) => {
		window.FB.api('/me/accounts', 'GET', { fields: 'picture,access_token,name,id' }, function (response) {
			rs(response);
		});
	});
};

export const getLoginStatus = () =>
	new Promise(async (rs, rj) => {
		window.FB.getLoginStatus(function (response) {
			if (response.status === 'connected') {
				rs({ userId: response.authResponse.userID, accessToken: response.authResponse.accessToken });
			} else {
				rs(null);
			}
		}, true);
	});

export const getLiveComment = (socialLiveVideoId, accessToken, since) =>
	new Promise(async (rs, rj) => {
		const query = { access_token: accessToken, fields: 'created_time, from{picture,name,id}, message, id' };
		if (since) {
			Object.assign(query, { since });
		}
		window.FB.api(`/${socialLiveVideoId}/comments`, 'GET', query, function (response) {
			if (response && !response.error) {
				rs(response);
			} else {
				rs({ data: [], error: response.error });
			}
		});
	});
