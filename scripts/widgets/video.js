
/* jshint undef: true */
/* global YT */
define(['modules/jquery-mozu', '//www.youtube.com/iframe_api'],
    function($) {
        var parseId,
            bind;
        parseId = function(url) {
            var expr = /(youtu\.be\/|[?&]v=)([^&]+)/,
                match = url.match(expr);

            if (match && match[2]) return match[2];
        };

        bind = function() {
            var $this = $(this),
                url = $this.data('url').trim(),
                id = parseId(url),
                address,
                player,
                $button,
                $player,
                $cover;

            if (!id && this.data('id')) return;

            $this.data('id', id);

            address = '\'//img.youtube.com/vi/' + id + '/maxresdefault.jpg\'';

            $cover = $this.find('.mz-cms-video-cover').css({
                'background-image': 'url(' + address + ')',
                opacity: 1,
                'z-index':2
            }); 
            $player = $this.find('.mz-cms-video-player').attr('id', 'youtube-player-' + id);

            player = new YT.Player('youtube-player-' + id, {
                height: '100%',
                width: '100%',
                playerVars: { 'rel':0},
                videoId: id
            });

            if ($this.data('edit')) return;
            
            $button = $this.find('.mz-cms-video-play').on('click', function() {
                $player = $this.find('.mz-cms-video-player').css({
                    opacity: 1
                });

                $button.css('display', 'none');
                $cover.css('display', 'none');

                setTimeout(function() {
                    $player.css('z-index', 10);
                }, 2200);

                player.playVideo();
            });
        };

        $(document).ready(function() {
            YT.ready(function () {
                $('.mz-cms-video-placeholder').each(bind);

                $(document).on('mozuwidgetdrop', function (e) {
                    $(e.currentTarget).find('.mz-cms-video-placeholder').each(bind);
                });
            });
        });
    }
);