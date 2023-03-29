const webpackConfig = {
    resolve: {
        alias: {
            buffer: "buffer"
        },
        fallback: {
            buffer: require.resolve('buffer/'),
        }
    }
}