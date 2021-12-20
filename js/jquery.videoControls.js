/*
 *author:toolzone@163.com
 *day:2021-12-18
 */
jQuery.fn.videoControls = function() {

    var instance = {};

    create = function(src) {
        // Base settings
        console.log(src)
        instance.playerj = $(src);
        instance.player = instance.playerj[0];
        instance.src_url = instance.playerj.attr('src');
        instance.file_name = instance.src_url.split('.')[0];
        instance.frame_rate = 24;
        instance.current_position = 0;
        instance.playings = false

        // DOM Elements

        instance.playerj.wrap('<div class="video_box"/>');
        instance.playerj.wrap('<div class="video_player"/>');
        instance.wrapper = instance.playerj.parent().parent();
        ``
        instance.wrapper
            .append('<ul class="play_tool"><li><span class="iconfontvideo vi-presec button stepRw"></span>' +
                '<span class="iconfontvideo vi-play button play"></span>' +
                '<span class="iconfontvideo vi-stop button stop" ></span>' +
                '<span class="iconfontvideo vi-nextsec button stepFf"></span>' +
                '<span class="iconfontvideo cutline"></span><span class="iconfontvideo vi-segplay button segplay" id="segplay"></span>' +
                '<span class="iconfontvideo vi-segstop button" id="segstop"></span>' +
                '</li><li><div><span class="timer">00:00:00:00</span>/<span class="timerlength">00:00:00:00</span></div>' +
                '<div class="iconfontvideo vi-voice button volumeBar" data-model="true">' +
                '<div class="button volumeBarbox" data-model="false"><div class="volumeBarline" ><div class="volumecap"></div></div></div></div></li>' +
                '</ul>')
            .append('<div class="playbarbox" id="playbarbox"><div class="playbar" id="playbar"><div class="track_bg" id="loadbg"></div><div class="play_head"></div><div id="video-range-bar"></div><div class="track_loaded"></div></div></div>')
            .append('<li>Timecode in: <input type="text" class="timerInput" /></li>');
        instance.player.addEventListener("timeupdate", function() {
            display_timecode();
        }, false);
        instance.player.addEventListener("loadedmetadata", function() {
            instance.playbar_width = parseInt(instance.wrapper.find('.playbar').css('width'), 10);
            instance.playhead_width = parseInt(instance.wrapper.find('.play_head').css('width'), 10);
            instance.wrapper.find('.timerlength').text(formatTimer(instance.player.duration));
        }, false);

        // Setup Controls

        instance.wrapper.find('.button.play').click(function() { playpause(); return false; });
        instance.wrapper.find('.button.stepRw').click(function() { playstartstop(); return false; });
        instance.wrapper.find('.button.stepFf').click(function() { playendstop(); return false; });
        instance.wrapper.find('.button.stop').mousedown(function() {
            console.log(instance.player);
            playstop();
            return false;
        });

        instance.wrapper.find('.button.segplay').mousedown(function() { segplay(); return false; });
        instance.wrapper.find('.button.vi-segstop').mousedown(function() { segstop(); return false; });

        instance.wrapper.find('.play_head').mousedown(function(e) { playHeadDrag(e); return false; });

        instance.wrapper.find('.volumeBarline').click(function(e) { playvolumeBar(e); return false; });
        instance.wrapper.find('.volumecap').mousedown(function(e) { playvolumecap(e); return false; });
        instance.wrapper.find('.button.volumeBar').click(function(e) { playmuted(e); return false; });

        // Control Bar

        instance.wrapper.find('.track_loaded').mousedown(function(e) {
            instance.offset = $(e.target).offset();
        }).click(function(e) {
            position_to_time(e);
        });

        activateInput(instance.wrapper.find('.timerInput'), instance.player);
        activateKeyControl();

    };

    // Control Methods
    var segplay = function() {
        console.log(instance.playings)
        if (instance.playings) {
            instance.playings = false;
            instance.wrapper.find('.button.segplay').addClass('vi-segplay').removeClass('vi-segpause');
        } else {
            instance.playings = true;
            instance.wrapper.find('.button.segplay').removeClass('vi-segplay').addClass('vi-segpause');
        }

        instance.playing = false;
        instance.wrapper.find('.button.play').removeClass('pause').removeClass('vi-pause').addClass('vi-play').addClass('play');
    }
    var segstop = function() {
        instance.player.pause();
        instance.playing = false;
        instance.wrapper.find('.button.segplay').addClass('vi-segplay').removeClass('vi-segpause');

        instance.playing = false;
        instance.wrapper.find('.button.play').removeClass('pause').removeClass('vi-pause').addClass('vi-play').addClass('play');
    }
    var playpause = function() {
        if (instance.playing) {
            stopMovie();
            instance.playing = false;
        } else {
            if (instance.player.currentTime == instance.player.duration) {
                instance.player.currentTime = 0
            }
            playMovie();
            instance.playing = true;
        }
    };

    var playvolumeBar = function(e) {
        var volume = instance.wrapper.find('.volumeBarline')
        var position = e.pageY - volume.offset().top;
        var percentage = 100 * position / volume.height();
        instance.wrapper.find('.volumecap')[0].style.top = percentage + 'px';
        var number = (100 - percentage) / 100;
        if (number < 0) { number = 0 }
        instance.player.volume = (100 - percentage) / 100;
    }

    var playvolumecap = function(ev) {
        // ev.preventdefault()
        var bar = instance.wrapper.find('.volumeBarline')[0]
        let box = instance.wrapper.find('.volumecap')[0]
        var cha = bar.offsetHeight - box.offsetHeight
        let boxL = box.offsetTop
        let mouseY = ev.pageY //鼠标按下的位置
        window.onmousemove = function(ev) {
            let e = ev || window.event
            let moveL = e.pageY - mouseY //鼠标移动的距离
            let newL = boxL + moveL //left值
                // 判断最大值和最小值
            if (newL < 0) { newL = 0 }
            if (newL >= cha) { newL = cha }
            // 改变left值
            box.style.top = newL + 'px'
                // 计算比例
            var number = (100 - newL) / 100;
            if (number < 0) { number = 0 }
            instance.player.volume = number;
            return false //取消默认事件
        }
        window.onmouseup = function() {
            window.onmousemove = false //解绑移动事件
            return false
        }
        return false
    };

    var playmuted = function(e) {
        console.log(e, e.currentTarget.dataset)
        if (e.currentTarget.dataset.model) {
            instance.player.muted = !instance.player.muted;
            if (instance.player.muted) {
                instance.wrapper.find('.volumecap')[0].style.top = '100px';
                instance.player.volume = 1;
                instance.wrapper.find('.button.volumeBar').removeClass('vi-voice').addClass('vi-novoice');
            } else {
                instance.wrapper.find('.volumecap')[0].style.top = '0px';
                instance.player.volume = 0;
                instance.wrapper.find('.button.volumeBar').addClass('vi-voice').removeClass('vi-novoice');
            }
        }

        return false;
    };
    var playendstop = function() {
        instance.player.pause();
        instance.playing = false;
        instance.player.currentTime = instance.player.duration;
        instance.wrapper.find('.button.play').removeClass('pause').removeClass('vi-pause').addClass('vi-play').addClass('play');
    };
    var playstartstop = function() {
        instance.player.pause();
        instance.playing = false;
        instance.player.currentTime = 0;
        instance.wrapper.find('.button.play').removeClass('pause').removeClass('vi-pause').addClass('vi-play').addClass('play');
    };

    var playstop = function() {
        instance.player.pause();
        instance.playing = false;
        instance.player.currentTime = 0
        instance.wrapper.find('.button.play').removeClass('pause').removeClass('vi-pause').addClass('vi-play').addClass('play');
    };
    var playMovie = function() {
        instance.player.play();
        instance.wrapper.find('.button.play').removeClass('vi-play').addClass('vi-pause');
    };

    var stopMovie = function() {
        instance.player.pause();
        instance.wrapper.find('.button.play').removeClass('vi-pause').addClass('vi-play');
    };

    var seek = function(speed) {
        if (!instance.playing) {
            instance.stopAgain = true;
            playMovie();
        };
        instance.player.playbackRate = speed;
        if (instance.stopAgain && speed == 1) {
            instance.stopAgain = false;
            stopMovie();
        };
    };

    // Keyboard Control

    var activateKeyControl = function() {
        $(document).keydown(function(e) {
            if (e.keyCode == 32) { // Space Bar
                playpause();
            }
            // Arrow Keys
            if (e.keyCode == 37) {
                instance.player.currentTime = instance.player.currentTime - 1 / instance.frame_rate;
            }
            if (e.keyCode == 39) {
                instance.player.currentTime = instance.player.currentTime + 1 / instance.frame_rate;
            }
            if (e.keyCode == 38) {
                instance.player.currentTime = instance.player.currentTime + 1;
            }
            if (e.keyCode == 40) {
                instance.player.currentTime = instance.player.currentTime - 1;
            }
        });
    };

    // Drag Playhead

    var playHead = {
        mdown: false
    };

    var playHeadDrag = function(e) {
        playHead.mdown = true;
        if (instance.playing) {
            instance.startAgain = true;
            stopMovie();
        };
    };

    $(document).mouseup(function(e) {
        if (playHead.mdown) {
            playHead.mdown = false;
            if (instance.startAgain) {
                instance.startAgain = false;
                playMovie();
            };
        }
    });

    $(document).mousemove(function(e) {
        if (playHead.mdown) {
            position_to_time(e);
        }
    });

    // Timecode Display

    var display_timecode = function() {
        instance.wrapper.find('.timer').text(formatTimer(instance.player.currentTime));
        instance.playhead = Math.round((instance.player.currentTime / instance.player.duration) * (instance.playbar_width));
        instance.wrapper.find('.play_head').css('left', instance.playhead - (instance.playhead_width / 2) + 'px');
        instance.wrapper.find('.timerlength').text(formatTimer(instance.player.duration));
    };

    // Timecode Control

    var activateInput = function(o, framerate) {
        o.keydown(function(e) {
            if (e.keyCode === 13) {
                var vals = o.val().split(':');
                var pos = 0;
                pos += parseInt(vals[0], 10) * 60 * 60; // Hours
                pos += parseInt(vals[1], 10) * 60; // Minutes
                pos += parseInt(vals[2], 10); // Seconds
                pos += vals[3] * (1 / instance.frame_rate); // Frames
                instance.player.currentTime = pos;
                return false;
            } else if (e.keyCode > 47 && e.keyCode < 58 || e.keyCode > 95 && e.keyCode < 106) {
                var val = o.val().replace(/:/g, '') + String.fromCharCode(e.keyCode);
                if (val.length <= 8) {
                    var newval = '';
                    for (var i = 0; i < val.length; i++) {
                        newval += val.charAt(i);
                        if (i % 2 == 1 && i < 7) newval += ':';
                    }
                    o.val(newval);
                }
                return false;
            } else if (e.keyCode === 186 || e.keyCode === 8 || e.keyCode === 46 || e.keyCode > 36 && e.keyCode < 41) {
                return true;
            } else {
                return false;
            }
        }).keyup(function() { return false; });
    };

    // Loaders

    var loading = function(e) {

        if (instance.player.buffered.end(0) >= instance.player.duration) {
            instance.wrapper.find('.track_loaded').css('width', '100%');
        } else {
            var pl = (instance.player.buffered.end(0) / instance.player.duration) * 100;
            instance.wrapper.find('.track_loaded').css('width', pl + '%');
        }
    };

    // Utilities

    var position_to_time = function(e) {
        var pos;
        var clickx = e.clientX - instance.playerj.offset().left;
        if (clickx >= (instance.playbar_width)) {
            pos = instance.player.duration;
        } else if (clickx <= 0) {
            pos = Math.floor(0);
        } else {
            pos = instance.player.duration * (clickx / instance.playbar_width);
        }
        instance.player.currentTime = pos;
    };

    var formatTimer = function(position) {
        var ft_hours = Math.floor((position / (60 * 60)) % 24);
        var ft_minutes = Math.floor((position / (60)) % 60);
        var ft_seconds = Math.floor((position) % 60);
        var ft_frames = Math.floor((position - Math.floor(position)) * instance.frame_rate);
        ft_hours += '';
        ft_hours = pad(ft_hours);
        ft_minutes += '';
        ft_minutes = pad(ft_minutes);
        ft_seconds += '';
        ft_seconds = pad(ft_seconds);
        ft_frames += '';
        ft_frames = pad(ft_frames);
        var formattedTime = ft_hours + ':' + ft_minutes + ':' + ft_seconds + ':' + ft_frames;
        return formattedTime;
    };

    var pad = function(val) {
        if (val < 10) { val = "0" + val; }
        return val;
    };

    return $(this).each(function() {
        create(this);
    });
};